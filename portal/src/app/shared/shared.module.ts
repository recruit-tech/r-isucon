import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ApiService } from './api.service';
import { SessionService } from './session.service';
import { ModelService } from './model/model.service';
import { SSEService } from './sse.service';
import { AuthGuardService } from './authguard.service';
import { NotificationService } from './notification.service';
import { EventHubService } from './eventhub.service';
import { NgC3Module } from './ng-c3.module';

const MODULES = [
  // Do NOT include UniversalModule, HttpModule, or JsonpModule here
  CommonModule,
  RouterModule,
  FormsModule,
  ReactiveFormsModule,

  NgC3Module,
];

const PIPES = [
  // put pipes here
];

const COMPONENTS = [
  // put shared components here
];

const PROVIDERS = [
  ModelService,
  ApiService,
  SessionService,
  SSEService,
  AuthGuardService,
  NotificationService,
  EventHubService
];

@NgModule({
  imports: [
    ...MODULES
  ],
  declarations: [
    ...PIPES,
    ...COMPONENTS
  ],
  exports: [
    ...MODULES,
    ...PIPES,
    ...COMPONENTS
  ]
})
export class SharedModule {
static forRoot(): ModuleWithProviders {
  return {
    ngModule: SharedModule,
    providers: [
      ...PROVIDERS
    ]
  };
}
}
