import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { isBrowser } from 'angular2-universal';
import { JwtHelper } from 'angular2-jwt';

import { CacheService } from './cache.service';


@Injectable()
export class SessionService {
  readonly key = 'session-user';

  private isLoggedInSource = new BehaviorSubject(false);
  private teamNameSource = new BehaviorSubject('');
  private teamIdSource = new BehaviorSubject(null);
  private JwtHelper = new JwtHelper();

  isLoggedIn$ = this.isLoggedInSource.asObservable();
  teamName$ = this.teamNameSource.asObservable();
  teamId$ = this.teamIdSource.asObservable();

  constructor(public _cache: CacheService) {}

  set(value: any): void {
    let map = new Map();
    Object.keys(value).forEach((k) => {
      map.set(k, value[k]);
    });
    this._cache.set(this.key, map);
    this.publishIsLoggedIn();
    this.publishTeamName();
    this.publishTeamId();

    if (isBrowser) {
      window.sessionStorage.setItem(this.key, JSON.stringify(value));
    }
  }

  get(key: string): string | number {
    if (isBrowser && window.sessionStorage.getItem(this.key) !== null) {
      let session = JSON.parse(window.sessionStorage.getItem(this.key));
      return session[key];
    }

    if (this._cache.has(this.key)) {
      let session = this._cache.get(this.key);
      return session.get(key);
    }

    return undefined;
  }

  isExpired() {
    let v = '';
    if (this._cache.has(this.key) && this._cache.get(this.key).has('access_token')) {
      v = v || this._cache.get(this.key).get('access_token');
    }

    if (isBrowser && window.sessionStorage.getItem(this.key) !== null) {
      let session = JSON.parse(window.sessionStorage.getItem(this.key));
      v = v || session['access_token'];
    }

    let isExpired;
    try {
      isExpired = this.JwtHelper.isTokenExpired(v);
    } catch (e) {
      isExpired = true;
    }

    return isExpired;
  }

  clear() {
    if (isBrowser) {
      window.sessionStorage.clear();
    }
    this._cache.delete(this.key);

    this.publishIsLoggedIn();
    this.publishTeamName();
    this.publishTeamId();
  }

  publishIsLoggedIn(): void {
    let v = this._cache.has(this.key) && this._cache.get(this.key).has('access_token');
    if (isBrowser && window.sessionStorage.getItem(this.key) !== null) {
      let session = JSON.parse(window.sessionStorage.getItem(this.key));
      v = v || typeof session['access_token'] !== 'undefined';
    }

    this.isLoggedInSource.next(v);
  }

  publishTeamName() {
    let v;
    if (this._cache.has(this.key) && this._cache.get(this.key).has('team_name')) {
      v = this._cache.get(this.key).get('team_name') || '';
    }

    if (isBrowser && window.sessionStorage.getItem(this.key) !== null) {
      let session = JSON.parse(window.sessionStorage.getItem(this.key));
      v = v || session['team_name'];
    }

    this.teamNameSource.next(v);
  }

  publishTeamId() {
    let v;
    if (this._cache.has(this.key) && this._cache.get(this.key).has('team_id')) {
      v = this._cache.get(this.key).get('team_id') || null;
    }

    if (isBrowser && window.sessionStorage.getItem(this.key) !== null) {
      let session = JSON.parse(window.sessionStorage.getItem(this.key));
      v = v || session['team_id'];
    }

    this.teamIdSource.next(v);
  }

  logout(): void {
    this.clear();
  }
}
