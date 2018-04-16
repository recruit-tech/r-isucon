import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


@Injectable()
export class EventHubService {
  private source = new BehaviorSubject({type: '', value: null});
  event$ = this.source.asObservable();

  constructor() {}

  emit(type: string, value: any) {
    this.source.next({type, value});
  }
}
