import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatListItem } from '@angular/material/list';
import { MatNavList } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';

import { LandingPageComponent } from '../landing-page/landing-page.component';
import { CalendarPageComponent } from '../calendar-page/calendar-page.component';
import { ContactPageComponent } from '../contact-page/contact-page.component';
import { ImprintPageComponent } from '../imprint-page/imprint-page.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule, 
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSidenavModule,
    MatListModule,
    MatListItem,
    MatNavList,
    MatMenuModule,
    LandingPageComponent,
    CalendarPageComponent,
    ContactPageComponent,
    ImprintPageComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {

}
