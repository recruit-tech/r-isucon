import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { ModelService } from '../shared/model/model.service';
import { SessionService } from '../shared/session.service';


@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.Emulated,
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.css']
})
export class LoginComponent implements OnInit {
  public name = '';
  public password = '';

  @ViewChild('dialog') dialog;

  constructor(private route: Router, private session: SessionService, private model: ModelService) { }

  ngOnInit() {
    this.universalInit();
  }

  universalInit() {
    this.session.clear();
  }

  onSubmit() {
    let body = {
      name: this.name,
      password: this.password
    };

    this.model.create('/api/login', body).subscribe(
      (data) => {
        this.session.set(data);
        this.route.navigate(['/home']);
      },
      (err) => {
        this.dialog.nativeElement.showModal();
        console.log('err', err);
      }
    );
  }
}
