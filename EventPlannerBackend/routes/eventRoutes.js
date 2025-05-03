const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // For generating secure tokens
const jwt = require('jsonwebtoken'); // For JWT tokens
const multer = require('multer');
const { authMiddleware } = require('./authRoutes');

// provide baseurl of server
const serverUrl = "http://localhost:4200";

// Ensure the QR code directory exists
const qrCodeDir = path.join(__dirname, '../public/qr-codes');
if (!fs.existsSync(qrCodeDir)) {
    fs.mkdirSync(qrCodeDir, { recursive: true });
}

// Ensure directory for image uploads exists
const uploadeDir = path.join(__dirname, '../public/uploads');
if(!fs.existsSync(uploadeDir)) {
    fs.mkdirSync(uploadeDir, { recursive: true });
}

// setup multer for saving files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadeDir);
    }, filename: function (req, file, cb) {
        const generatedFileName = `event-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, generatedFileName);
    }
});

const upload = multer({ storage: storage, });

// Helper funktion to structure async funktions
function queryAsync(sql, params) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if(err) reject(err);
            else resolve(result);
        });
    });
}

// Function to generate a secure access token for an event
function generateEventAccessToken(eventId, userId) {
    return jwt.sign(
        { 
            eventId, 
            createdBy: userId,
            createdAt: Date.now(),
            type: 'event-access'
        }, 
        process.env.JWT_SECRET
    );
}

// Create an event with venue
router.post('/create', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        let { 
            title, 
            description, 
            venue,
            playlist_id, 
            startdate, 
            enddate, 
            image,
            max_guests,
            survey_id
        } = req.body;
        const userId = req.user;


        // parse venue to json
        if(venue) venue = JSON.parse(req.body.venue);

        // is image file or path
        if (req.file) {
            image = '/uploads/' + req.file.filename;
        } else if (image) {
            image = image;
        }

        // First, create the venue if provided
        let venueId = null;
        if (venue) {
            const { street, city, postal_code, google_maps_link } = venue;
            
            // Insert the venue into the database
            db.query(
                'INSERT INTO event_management.venue (street, city, postal_code, google_maps_link) VALUES (?, ?, ?, ?)',
                [street, city, postal_code, google_maps_link],
                (err, venueResult) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    
                    venueId = venueResult.insertId;
                    // Continue with event creation using the new venue_id
                    createEventWithVenue(venueId);
                }
            );
        } else if (req.body.venue_id) {
            // If venue_id is provided instead of venue object, use it directly
            venueId = req.body.venue_id;
            createEventWithVenue(venueId);
        } else {
            return res.status(400).json({ error: "Either venue object or venue_id must be provided" });
        }

        // Function to create event once we have the venue ID
        function createEventWithVenue(venueId) {
            // Insert event into the database first to get the event ID
            db.query(
                'INSERT INTO event_management.event (title, description, venue_id, playlist_id, startdate, enddate, max_guests, image, active, survey_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [title, description, venueId, playlist_id, startdate, enddate, max_guests, image, 1, survey_id],
                async (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    const eventId = result.insertId;
                    
                    // Generate secure access token for the event
                    const accessToken = generateEventAccessToken(eventId, userId);
                    
                    // Store access token in the database - can be a new field in the event table or a separate table
                    db.query(
                        'UPDATE event_management.event SET access_token = ? WHERE event_id = ?',
                        [accessToken, eventId],
                        (tokenErr) => {
                            if (tokenErr) {
                                console.error("Error saving access token:", tokenErr);
                            }
                        }
                    );
                    
                    // Generate QR Code with event ID and access token
                    try {
                        // The URL now includes the access token
                        const qrData = `${serverUrl}/EventPlannerFrontend/event/${eventId}?token=${accessToken}`; //for local dev-server: http://localhost:4200/EventPlannerFrontend/...
                        const qrFileName = `event-${eventId}-${Date.now()}.png`;
                        const qrFilePath = path.join(qrCodeDir, qrFileName);
                        const qrRelativePath = `/qr-codes/${qrFileName}`;
                        
                        // Generate QR code and save to file
                        await QRCode.toFile(qrFilePath, qrData);
                        
                        // Insert QR Code info into the database - now including the access token
                        db.query(
                            'INSERT INTO event_management.qr_code (url, access_token, qr_image) VALUES (?, ?, ?)',
                            [qrData, accessToken, qrRelativePath],
                            (qrErr, qrResult) => {
                                if (qrErr) {
                                    console.error("Error saving QR code to database:", qrErr);
                                } else {
                                    // Update event with QR code ID
                                    db.query(
                                        'UPDATE event_management.event SET qr_id = ? WHERE event_id = ?',
                                        [qrResult.insertId, eventId],
                                        (updateErr) => {
                                            if (updateErr) {
                                                console.error("Error updating event with QR code ID:", updateErr);
                                            }
                                        }
                                    );
                                }
                            }
                        );
                        
                        // Create relationship between user and event (organizer)
                        db.query(
                            'INSERT INTO event_management.user_event (user_id, event_id, confirmation, owner) VALUES (?, ?, ?, ?)',
                            [userId, eventId, 1, 1],
                            (userEventErr) => {
                                if (userEventErr) {
                                    console.error("Error creating user-event relationship:", userEventErr);
                                }
                            }
                        );

                        // Return new event with all details
                        db.query(`
                            SELECT e.*, v.street, v.city, v.postal_code, v.google_maps_link, 
                                   qr.url as qr_url, qr.qr_image, qr.access_token
                            FROM event_management.event e
                            LEFT JOIN event_management.venue v ON e.venue_id = v.venue_id
                            LEFT JOIN event_management.qr_code qr ON e.qr_id = qr.qr_id
                            WHERE e.event_id = ?
                        `, [eventId], (err, events) => {
                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }
                            res.json(events[0]);
                        });
                    } catch (qrErr) {
                        console.error("Error generating QR code file:", qrErr);
                        
                        // Even if QR code generation fails, return the created event
                        db.query(`
                            SELECT e.*, v.street, v.city, v.postal_code, v.google_maps_link, e.access_token
                            FROM event_management.event e
                            LEFT JOIN event_management.venue v ON e.venue_id = v.venue_id
                            WHERE e.event_id = ?
                        `, [eventId], (err, events) => {
                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }
                            res.status(201).json({
                                ...events[0],
                                warning: "QR code generation failed"
                            });
                        });
                    }
                }
            );
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all owned events for logged in user
router.get('/my-events', authMiddleware, (req, res) => {
    const userId = req.user;
    
    // Query events where the user is the owner
    db.query(`
        SELECT e.*, v.street, v.city, v.postal_code
        FROM event_management.event e
        JOIN event_management.user_event ue ON e.event_id = ue.event_id
        LEFT JOIN event_management.venue v ON e.venue_id = v.venue_id
        WHERE ue.user_id = ? AND ue.owner = 1
        ORDER BY e.startdate DESC
    `, [userId], (err, events) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(events);
    });
});

//Get all invted events for logged in user
router.get('/my-events/invited', authMiddleware, (req, res) => {
    const userId = req.user;
    
    // Query events where the user is the invited
    db.query(`
        SELECT e.*, v.street, v.city, v.postal_code, ue.owner, ue.confirmation
        FROM event_management.event e
        JOIN event_management.user_event ue ON e.event_id = ue.event_id
        LEFT JOIN event_management.venue v ON e.venue_id = v.venue_id
        WHERE ue.user_id = ?
        ORDER BY e.startdate DESC
    `, [userId], (err, events) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(events);
    });
});

// Get Event From EventId
router.get('/my-events/:id', authMiddleware, async(req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user;

        // Query events where the Ids match
        db.query(`
            SELECT e.*, v.street, v.city, v.postal_code, v.google_maps_link, q.qr_image, q.url, u.firstname, u.lastname
            FROM event_management.event e
            JOIN event_management.user_event ue ON e.event_id = ue.event_id
            LEFT JOIN event_management.venue v ON e.venue_id = v.venue_id
            LEFT JOIN event_management.qr_code q ON e.qr_id = q.qr_id
            LEFT JOIN event_management.user u ON ue.user_id = u.user_id
            WHERE ue.user_id = ? AND ue.owner = 1 AND e.event_id = ?
        `, [userId, eventId], (err, events) => {
            if(err) {
                return res.status(500).json({ error: err.message });
            } else if (!events.length) {
                return res.status(404).json({ error: "Event not found" });
            }

            res.json(events[0]);
        });
    } catch (err) {
        res.status(500).json({error: err.message });
    }
});

// Edit Event by Id
router.post('/my-events/:id/edit', authMiddleware, upload.single('image'), async(req, res) => {
    try{
        const eventId = req.params.id;
        const userId = req.user;
        const eventData = req.body;

        let { 
            title, 
            description, 
            startdate, 
            enddate, 
            max_guests, 
            image,
            venue_id,
            venue,
        } = eventData;

        // parse venue to json
        venue = JSON.parse(req.body.venue);

        const { street, city, postal_code, google_maps_link } = venue;

        // is image file or path
        if (req.file) {
            image = '/uploads/' + req.file.filename;
        } else if (image) {
            image = image;
        }

        // update event Data
        db.query(`
            UPDATE event_management.event 
            SET title = ?, description = ?, startdate = ?, enddate = ?,  max_guests = ?, image = ? 
            WHERE event_id = ?
            `
            , [title, description, startdate, enddate, max_guests, image, eventId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            //update venue data
            db.query(`
                UPDATE event_management.venue
                SET street = ?, city = ?, postal_code = ?, google_maps_link = ?
                WHERE venue_id = ?
                `, [street, city, postal_code, google_maps_link, venue_id], (err, venueResult) => {
                    if(err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: "Event and Venue changed successfully" });
                });
            });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//delete event and connected data from id
router.delete('/my-events/:id', authMiddleware, async(req, res) => {
    const eventId = req.params.id;
    const userId = req.user;

    //check if user is owner
    db.query(`
        SELECT * FROM event_management.user_event WHERE event_id = ? AND user_id = ? AND owner = 1`,
    [eventId, userId],
    (err, events) => {
        if(err) return res.statur(500).json({ error: err.message });
        else if (!events.length) return res.status(404).json({ error: "No Events found for user and id" });

        //First find connected QR-code entries
        db.query(`
            SELECT qr_id FROM event_management.event WHERE event_id = ?`,
        [eventId], (err, eventQR) => {
            if(err) return res.status(500).json({ error: err.message });
            const qrId = eventQR[0]?.qr_id;

            //Delete connected user_event entry
            db.query(`
                DELETE FROM event_management.user_event WHERE event_id = ?`,
            [eventId], (err) => {
                if(err) return res.status(500).json({ error: err.message });

                //Delete Event entry
                db.query(`
                    DELETE FROM event_management.event WHERE event_id = ?`,
                [eventId], (err) => {
                    if(err) return res.status(500).json({ error: err.message });

                    //Delete QR code
                    if(qrId) {
                        db.query(`
                            DELETE FROM event_management.qr_code WHERE qr_id = ?`,
                        [qrId], (err) => {
                            if(err) console.error("QR deletion failes: ", err.message );
                        });
                    }

                    //optionally delete Venue (if not user anywhere else)
                    db.query(`
                        SELECT venue_id FROM event_management.event WHERE event_id = ?`,
                    [eventId], (err, eventVenue) => {
                        if(err) return res.status(500).json({ error: err.message });
                        
                        const venueId = eventVenue[0]?.venue_id;

                        if(venueId) {
                            db.query(`
                                SELECT COUNT(*) as count FROM event_management.event WHERE venue_id = ?`,
                            [venueId], (err, venueCount) => {
                                if(!err && venueCount[0].count === 0){
                                    db.query(`
                                        DELETE FROM event_management.venue WHERE venue_id = ?`,
                                    [venueId], (err) => {
                                        if(err) console.error("Failed to delete Venue: ", err.message);
                                    });
                                }
                            });  
                        }
                    });
                    return res.json({ sucess: true, message: "Event deleted" });
                });
            });
        });
    });
});

// event information after scanning qr (link + token) // !! Venue not in !!
router.get('/public-event/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { token } = req.query;
        
        if (!token) {
            return res.status(401).json({ error: "Access token required" });
        }
        
        // Check if the event exists with this token
        // Properly join the tables using qr_id
        db.query(
            `SELECT e.event_id, e.title, e.startdate, e.enddate, e.description, e.image, e.access_token, v.street, v.city, v.postal_code, v.google_maps_link, q.access_token as qr_access_token
             FROM event e
             LEFT JOIN qr_code q ON e.qr_id = q.qr_id
             LEFT JOIN event_management.venue v ON e.venue_id = v.venue_id
             WHERE e.event_id = ? AND (e.access_token = ? OR q.access_token = ?)`,
            [eventId, token, token],
            (err, events) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ error: err.message });
                }
                
                if (events.length === 0) {
                    return res.status(403).json({ error: "Invalid event or access token" });
                }
                
                const event = events[0];
                
                res.json({
                    id: event.event_id,
                    title: event.title, 
                    startdate: event.startdate,
                    enddate: event.enddate,
                    description: event.description,
                    image: event.image,
                    street: event.street,
                    city: event.city,
                    postalCode: event.postal_code
                });
            }
        );
    } catch (err) {
        console.error("Route error:", err);
        res.status(500).json({ error: err.message });
    }
});

// create survey
router.post('/survey/create', authMiddleware, async (req, res) => {
    try {
        const { 
            description,
            questions
        } = req.body;

        if(!Array.isArray(questions)){
            return res.status(400).json({ message: 'Invalid request body.' });
        }

        // Insert event into the database first to get the survey ID
        const surveyResult = await queryAsync(`
            INSERT INTO event_management.survey ( description, active) VALUES (?, 1)`,
            [description]
        );

        const surveyId = surveyResult.insertId;

        for(const question of questions) {
            const qResult = await queryAsync(
                'INSERT INTO event_management.question ( question_text) VALUES (?)',
                [question.question_text]
            );

            const questionId = qResult.insertId;

            await queryAsync(
                'INSERT INTO event_management.survey_question (survey_id, question_id) VALUES (?, ?)',
                [surveyId, questionId]
            );

            for(const answerText of question.offered_answer) {
                const aResult = await queryAsync(
                    'INSERT INTO event_management.offeredanswers (answer_text) VALUES (?)',
                    [answerText]
                );

                const answerId = aResult.insertId;

                await queryAsync (
                    'INSERT INTO event_management.question_offeredanswers (question_id, offered_answers_id) VALUES (?, ?)',
                    [questionId, answerId]
                );
            }
        }

        const survey = await queryAsync(
            `SELECT s.*, q.question_id, q.question_text, o.offered_answers_id, o.answer_text
            FROM event_management.survey s
             LEFT JOIN event_management.survey_question x ON s.survey_id = x.survey_id
             LEFT JOIN event_management.question q ON x.question_id = q.question_id
             LEFT JOIN event_management.question_offeredanswers y ON q.question_id = y.question_id
             LEFT JOIN event_management.offeredanswers o ON y.offered_answers_id = o.offered_answers_id

            WHERE s.survey_id = ?`,
            [surveyId]
        );

        res.json(survey[0] || { message: "No survey Data found." });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Guests for Event from EventId
router.get('/:eventId/guests', authMiddleware, async(req, res) => {
    try {
        const eventId = req.params.eventId;

        db.query(`
            SELECT u.firstname AS guest_firstname, u.lastname AS guest_lastname, u.email, ue.confirmation, ue.owner, NULL AS guest_info
            FROM event_management.user_event ue
            JOIN event_management.user u ON u.user_id = ue.user_id
            WHERE ue.event_id = ? AND ue.owner = 0
            UNION
            SELECT  eg.firstname AS guest_firstname, eg.lastname AS guest_lastname, NULL as email, 1 AS confirmation, 0 AS OWNER, CONCAT(u.firstname, ' ', u.lastname) AS guest_info
            FROM event_management.extra_guests eg
            LEFT JOIN event_management.user u ON u.user_id = eg.user_id
            WHERE eg.event_id = ?
            `, [eventId, eventId], (err, guests) => {
                if(err) {
                    return res.status(500).json({ error: err.message });
                }

                res.json(guests);
            });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Adding guest to an event
router.post('/:eventId/guests/add', authMiddleware, async (req, res) => {
    const eventId = req.params.eventId;
    const userId = req.user;
    const { type, confirmation, guest } = req.body;
    try {
        const validateCapacity = await queryAsync(`
            SELECT
                (SELECT COUNT(*)
                FROM (
                    SELECT user_id FROM event_management.user_event WHERE event_id = ? AND confirmation = 1 AND owner = 0
                    UNION ALL
                    SELECT extra_guests_id FROM event_management.extra_guests WHERE event_id = ?
                ) AS combined) AS current_guests,
                (SELECT max_guests FROM event_management.event WHERE event_id = ?) AS max_guests`,
            [eventId, eventId, eventId]);
        const { current_guests, max_guests } = validateCapacity[0];
        if(current_guests >= max_guests ) {
            return res.status(400).json({ message: 'Maximal guest capacity reached'});
        }

        if(type === 'user') {
            const exists = await queryAsync(`
                SELECT * FROM event_management.user_event WHERE user_id = ? AND event_id = ?`,
            [userId, eventId]);

            if(exists.length > 0) {
                return res.status(400).json({ message: 'User already exists on Eent'});
            }

            await queryAsync(`
                INSERT INTO event_management.user_event (user_id, event_id, confirmation, owner) VALUES (?, ?, ?, 0)`,
            [userId, eventId, confirmation]);

            return res.status(201).json({ message: 'Added User to Event' });
        } else if (type === 'extra') {
            const { firstname, lastname } = guest;

            const exists = await queryAsync(`
                SELECT * FROM event_management.extra_guests WHERE user_id = ? AND firstname = ? AND lastname = ?`,
            [userId, eventId, firstname, lastname]);

            if(exists.length > 0 ){
                return res.status(400).json({ message: 'Extra guest already exists on Eent'});
            }

            await queryAsync(`
                INSERT INTO event_management.extra_guests (user_id, event_id, firstname, lastname) VALUES (?, ?, ?, ?)`,
            [userId, eventId, firstname, lastname]);

            return res.status(201).json({ message: 'Added Extra-Guest to Event' });
        } else {
            return res.status(400).json({ message: 'Guest Type invalid' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error while inserting guest to Event' });
    }
});

module.exports = router;