-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Erstellungszeit: 21. Mrz 2025 um 14:18
-- Server-Version: 10.4.32-MariaDB
-- PHP-Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `event_management`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `answer`
--

CREATE TABLE `answer` (
  `answer_id` int(11) NOT NULL,
  `survey_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `offered_answers_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `event`
--

CREATE TABLE `event` (
  `event_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `venue_id` int(11) DEFAULT NULL,
  `playlist_id` int(11) DEFAULT NULL,
  `qr_id` int(11) DEFAULT NULL,
  `access_token` varchar(255) DEFAULT NULL,
  `startdate` datetime NOT NULL,
  `enddate` datetime NOT NULL,
  `active` tinyint(1) DEFAULT 1,
  `max_guests` int(11) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `survey_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `extra_guests`
--

CREATE TABLE `extra_guests` (
  `extra_guests_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `offeredanswers`
--

CREATE TABLE `offeredanswers` (
  `offered_answers_id` int(11) NOT NULL,
  `answer_text` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `playlist`
--

CREATE TABLE `playlist` (
  `playlist_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `playlist`
--

INSERT INTO `playlist` (`playlist_id`) VALUES
(1);

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `qr_code`
--

CREATE TABLE `qr_code` (
  `qr_id` int(11) NOT NULL,
  `url` varchar(1000) NOT NULL,
  `access_token` varchar(255) DEFAULT NULL,
  `qr_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `question`
--

CREATE TABLE `question` (
  `question_id` int(11) NOT NULL,
  `question_text` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `question_offeredanswers`
--

CREATE TABLE `question_offeredanswers` (
  `question_offered_answers_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `offered_answers_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `survey`
--

CREATE TABLE `survey` (
  `survey_id` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `active` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `survey_question`
--

CREATE TABLE `survey_question` (
  `survey_question_id` int(11) NOT NULL,
  `survey_id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `user`
--

CREATE TABLE `user` (
  `user_id` int(11) NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `lastname` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `user`
--

INSERT INTO `user` (`user_id`, `firstname`, `lastname`, `email`, `password`) VALUES
(1, 'Max', 'Mustermann', 'max.mustermann@beispiel.de', '$2b$10$roR7Tb1Y/pwnAs314HSjHeh0I.1NI5i8Um.eaN8VzWL0t7v2lEsfW');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `user_event`
--

CREATE TABLE `user_event` (
  `user_event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `event_id` int(11) NOT NULL,
  `confirmation` tinyint(1) DEFAULT 0,
  `owner` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `venue`
--

CREATE TABLE `venue` (
  `venue_id` int(11) NOT NULL,
  `street` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `postal_code` int(11) NOT NULL,
  `google_maps_link` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `answer`
--
ALTER TABLE `answer`
  ADD PRIMARY KEY (`answer_id`),
  ADD UNIQUE KEY `survey_id` (`survey_id`,`question_id`,`user_id`),
  ADD KEY `question_id` (`question_id`),
  ADD KEY `offered_answers_id` (`offered_answers_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indizes für die Tabelle `event`
--
ALTER TABLE `event`
  ADD PRIMARY KEY (`event_id`),
  ADD KEY `venue_id` (`venue_id`),
  ADD KEY `playlist_id` (`playlist_id`),
  ADD KEY `qr_id` (`qr_id`),
  ADD KEY `survey_id` (`survey_id`);

--
-- Indizes für die Tabelle `extra_guests`
--
ALTER TABLE `extra_guests`
  ADD PRIMARY KEY (`extra_guests_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indizes für die Tabelle `offeredanswers`
--
ALTER TABLE `offeredanswers`
  ADD PRIMARY KEY (`offered_answers_id`);

--
-- Indizes für die Tabelle `playlist`
--
ALTER TABLE `playlist`
  ADD PRIMARY KEY (`playlist_id`);

--
-- Indizes für die Tabelle `qr_code`
--
ALTER TABLE `qr_code`
  ADD PRIMARY KEY (`qr_id`);

--
-- Indizes für die Tabelle `question`
--
ALTER TABLE `question`
  ADD PRIMARY KEY (`question_id`);

--
-- Indizes für die Tabelle `question_offeredanswers`
--
ALTER TABLE `question_offeredanswers`
  ADD PRIMARY KEY (`question_offered_answers_id`),
  ADD UNIQUE KEY `question_id` (`question_id`,`offered_answers_id`),
  ADD KEY `offered_answers_id` (`offered_answers_id`);

--
-- Indizes für die Tabelle `survey`
--
ALTER TABLE `survey`
  ADD PRIMARY KEY (`survey_id`);

--
-- Indizes für die Tabelle `survey_question`
--
ALTER TABLE `survey_question`
  ADD PRIMARY KEY (`survey_question_id`),
  ADD UNIQUE KEY `survey_id` (`survey_id`,`question_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indizes für die Tabelle `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indizes für die Tabelle `user_event`
--
ALTER TABLE `user_event`
  ADD PRIMARY KEY (`user_event_id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`event_id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indizes für die Tabelle `venue`
--
ALTER TABLE `venue`
  ADD PRIMARY KEY (`venue_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `answer`
--
ALTER TABLE `answer`
  MODIFY `answer_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `event`
--
ALTER TABLE `event`
  MODIFY `event_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `extra_guests`
--
ALTER TABLE `extra_guests`
  MODIFY `extra_guests_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `offeredanswers`
--
ALTER TABLE `offeredanswers`
  MODIFY `offered_answers_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `playlist`
--
ALTER TABLE `playlist`
  MODIFY `playlist_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT für Tabelle `qr_code`
--
ALTER TABLE `qr_code`
  MODIFY `qr_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `question`
--
ALTER TABLE `question`
  MODIFY `question_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `question_offeredanswers`
--
ALTER TABLE `question_offeredanswers`
  MODIFY `question_offered_answers_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `survey`
--
ALTER TABLE `survey`
  MODIFY `survey_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `survey_question`
--
ALTER TABLE `survey_question`
  MODIFY `survey_question_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `user`
--
ALTER TABLE `user`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT für Tabelle `user_event`
--
ALTER TABLE `user_event`
  MODIFY `user_event_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT für Tabelle `venue`
--
ALTER TABLE `venue`
  MODIFY `venue_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `answer`
--
ALTER TABLE `answer`
  ADD CONSTRAINT `answer_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `survey` (`survey_id`),
  ADD CONSTRAINT `answer_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`),
  ADD CONSTRAINT `answer_ibfk_3` FOREIGN KEY (`offered_answers_id`) REFERENCES `offeredanswers` (`offered_answers_id`),
  ADD CONSTRAINT `answer_ibfk_4` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`);

--
-- Constraints der Tabelle `event`
--
ALTER TABLE `event`
  ADD CONSTRAINT `event_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `venue` (`venue_id`),
  ADD CONSTRAINT `event_ibfk_2` FOREIGN KEY (`playlist_id`) REFERENCES `playlist` (`playlist_id`),
  ADD CONSTRAINT `event_ibfk_3` FOREIGN KEY (`qr_id`) REFERENCES `qr_code` (`qr_id`),
  ADD CONSTRAINT `event_ibfk_4` FOREIGN KEY (`survey_id`) REFERENCES `survey` (`survey_id`);

--
-- Constraints der Tabelle `extra_guests`
--
ALTER TABLE `extra_guests`
  ADD CONSTRAINT `extra_guests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `extra_guests_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`);

--
-- Constraints der Tabelle `question_offeredanswers`
--
ALTER TABLE `question_offeredanswers`
  ADD CONSTRAINT `question_offeredanswers_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`),
  ADD CONSTRAINT `question_offeredanswers_ibfk_2` FOREIGN KEY (`offered_answers_id`) REFERENCES `offeredanswers` (`offered_answers_id`);

--
-- Constraints der Tabelle `survey_question`
--
ALTER TABLE `survey_question`
  ADD CONSTRAINT `survey_question_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `survey` (`survey_id`),
  ADD CONSTRAINT `survey_question_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `question` (`question_id`);

--
-- Constraints der Tabelle `user_event`
--
ALTER TABLE `user_event`
  ADD CONSTRAINT `user_event_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`),
  ADD CONSTRAINT `user_event_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
