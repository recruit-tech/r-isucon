import { Component, ViewEncapsulation, OnInit, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { isBrowser } from 'angular2-universal';

import { SessionService } from './shared/session.service';
import { EventHubService } from './shared/eventhub.service';

import '../../node_modules/material-design-lite/material.css';
import '../../node_modules/dialog-polyfill/dialog-polyfill.css';
import './app.global.css';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.Emulated,
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  teamName = '';
  teamId = null;
  isBrowser = false;
  isIndeterminate = false;

  @ViewChild('dialogRelogin') dialogRelogin;

  constructor(private session: SessionService, private hub: EventHubService) {}

  ngOnInit() {
    this.universalInit();
  }

  universalInit() {
    this.isBrowser = isBrowser;
    this.session.publishIsLoggedIn();
    this.session.publishTeamName();
    this.session.publishTeamId();

    this.session.isLoggedIn$.subscribe((isLoggedIn) => {
      this.isLoggedIn = isLoggedIn;

      if (this.isLoggedIn && this.session.isExpired()) {
        this.dialogRelogin.nativeElement.showModal();
      }
    });

    this.session.teamName$.subscribe((teamName) => {
      this.teamName = teamName;
    });

    this.session.teamId$.subscribe((teamId) => {
      this.teamId = teamId;
    });

    this.hub.event$.subscribe((event) => {
      if (event.type === 'indeterminate') {
        this.isIndeterminate = event.value;
      }
    });
  }

  logout() {
    this.session.logout();
    this.teamName = '';
    this.isLoggedIn = false;
  }
}
