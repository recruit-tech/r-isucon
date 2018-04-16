import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';
import { RegisterComponent } from './register.component';
import { RegisterRoutingModule } from './register-routing.moudle';

@NgModule({
  imports: [
    SharedModule,
    RegisterRoutingModule
  ],
  declarations: [
    RegisterComponent
  ]
})
export class RegisterModule { }
