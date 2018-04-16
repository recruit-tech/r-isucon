import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

import { SessionService } from './session.service';

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(private session: SessionService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|Promise<boolean>|boolean {
    if (typeof route.params['id'] === 'undefined' || !this.session.get('team_id')) {
      return false;
    }

    let id = +route.params['id'];
    return id === this.session.get('team_id');
  }
}
