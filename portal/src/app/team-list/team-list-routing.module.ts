import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TeamListComponent } from './team-list.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: 'teams', component: TeamListComponent }
    ])
  ]
})
export class TeamListRoutingModule { }
