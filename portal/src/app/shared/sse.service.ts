import { Injectable } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';

import { isBrowser } from 'angular2-universal';

interface EventSource extends EventTarget {
  close: () => void;
}

declare var EventSource: {
  prototype: EventTarget;
  new(type: string): EventSource;

  CONNECTING: 0;
  OPEN: 1;
  CLOSED: 2;
};

@Injectable()
export class SSEService {
  public fromEventSource = (url) => {
    return new Observable((observer) => {
      const source = new EventSource(url);

      const onError = (event) => {
        if (event.target.readyState === EventSource.CLOSED) {
          observer.complete();
        } else {
          observer.error(event);
        }
      };

      const onMessage = (event) => {
        observer.next(event.data);
      };

      source.addEventListener('error', onError, false);
      source.addEventListener('message', onMessage, false);

      return () => {
        source.removeEventListener('error', onError, false);
        source.removeEventListener('message', onMessage, false);
        source.close();
      };
    });
  };

  constructor() {

  }
}
