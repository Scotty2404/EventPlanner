import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {

eventList = [
  { eventName: 'Fabis Geburtstag', eventTitle: '22.03.2026 um 18:30 Uhr', eventInfo: 'hier kann etwas ganz langes hin wo man feiert, oder anderes infos o viel wie man will'},
  { eventName: 'Ellis Hochzeit', eventTitle: '04.07.2026 um 12:00 Uhr', eventInfo: 'auch hier kann man eine ganz lange info hin schreiben, egal was. einfach wann es los geht, wo und irgendwelche weiteren details' },
  { eventName: 'Patricias Jugendweihe', eventTitle: '25.05.2026 um 15:00 Uhr', eventInfo: 'auch ewas kurzes kann hier hin, klappt alles' },
  { eventName: 'Patricias Jugendweihe', eventTitle: '25.05.2026 um 15:00 Uhr', eventInfo: 'auch ewas kurzes kann hier hin, klappt alles' },
];

  constructor() { }


getEventList() {
  return this.eventList;
}

}
