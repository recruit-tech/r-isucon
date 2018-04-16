import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { TeamListComponent } from './team-list.component';
import { TeamListRoutingModule } from './team-list-routing.module';

@NgModule({
  imports: [
    SharedModule,
    TeamListRoutingModule
  ],
  declarations: [
    TeamListComponent
  ]
})
export class TeamListModule { }
