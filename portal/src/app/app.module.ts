import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { HomeModule } from './home/home.module';
import { TeamListModule } from './team-list/team-list.module';
import { TeamModule } from './team/team.module';
import { RegisterModule } from './register/register.module';
import { LoginModule } from './login/login.module';

import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MdlDirective } from './mdl.directive';


export function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDev() {
  return !isProd();
}

@NgModule({
  declarations: [ AppComponent, MdlDirective ],
  imports: [
    SharedModule,
    HomeModule,
    TeamListModule,
    TeamModule,
    RegisterModule,
    LoginModule,
    AppRoutingModule
  ],
  providers: [
    { provide: 'isProd', useFactory: isProd },
    { provide: 'isDev', useFactory: isDev },
    { provide: 'startDate', useValue: process.env.START_DATE },
    { provide: 'endDate', useValue: process.env.END_DATE }
  ]
})
export class AppModule {
}

export { AppComponent } from './app.component';
