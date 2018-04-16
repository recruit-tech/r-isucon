import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TeamComponent } from './team.component';
import { EditComponent } from './edit/edit.component';
import { AuthGuardService } from '../shared/authguard.service';


@NgModule({
  imports: [
    RouterModule.forChild([
      { path: 'teams/:id', component: TeamComponent },
      { path: 'teams/:id/edit', component: EditComponent, canActivate: [AuthGuardService] }
    ])
  ]
})
export class TeamRoutingModule { }

