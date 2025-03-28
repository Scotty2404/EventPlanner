import { Component, OnInit } from '@angular/core';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButton } from '@angular/material/button';
import { NgFor } from '@angular/common';
import { EventBoxComponent } from '../../components/event-box/event-box.component';
import { ApiService } from '../../services/api.service';
import { AddEventPageComponent } from '../add-event-page/add-event-page.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    MatButton, 
    MatCheckboxModule,
    RouterLink,
    MatButtonModule,
    NgFor,
    EventBoxComponent,
    AddEventPageComponent
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit{

  isLoaded = false;
  isFailed = false;
  eventList: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.apiService.getEvents().subscribe({
      next: (data) => {
        this.eventList = data;
        console.log(this.eventList);
        this.isLoaded = true;
      },
      error: (error) => {
        console.error('Error fetching Events: ', error);
        this.isFailed = true;
      }
    });
  }
}