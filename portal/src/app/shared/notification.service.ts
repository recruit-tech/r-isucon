import { Injectable } from '@angular/core';
import { isBrowser } from 'angular2-universal';


@Injectable()
export class NotificationService {
  private title = 'R-ISUCON';
  private bodyStarted = 'ベンチマーカーが開始しました';
  private bodyFinished = 'ベンチマーカーが終了しました';
  private icon = '/assets/icon.png';

  constructor() {}

  requestPermission() {
    if (isBrowser && !this.isPermitted) {
      window.Notification && Notification.requestPermission();
    }
  }

  create(title, body, icon) {
    let n = new Notification(title, {body, icon});
    n.onclick = () => { window.focus(); n.close(); };
    setTimeout(n.close.bind(n), 10000);
  }

  sendStarted() {
    if (isBrowser && this.isPermitted) {
      this.create(this.title, this.bodyStarted, this.icon);
    }
  }

  sendFinished() {
    if (isBrowser && this.isPermitted) {
      this.create(this.title, this.bodyFinished, this.icon);
    }
  }

  get isPermitted() {
    return window.Notification && Notification.permission === 'granted';
  }
}
