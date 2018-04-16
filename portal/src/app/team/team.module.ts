import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { TeamComponent } from './team.component';
import { TeamRoutingModule } from './team-routing.module';

import { EditComponent } from './edit/edit.component';

@NgModule({
  imports: [
    SharedModule,
    TeamRoutingModule
  ],
  declarations: [
    TeamComponent,
    EditComponent
  ]
})
export class TeamModule { }
