import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import 'rxjs/add/operator/switchMap';

import { Team } from '../shared/model/team.model';
import { ModelService } from '../shared/model/model.service';


@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.Emulated,
  selector: 'app-register',
  templateUrl: 'register.component.html',
  styleUrls: ['register.component.css']
})
export class RegisterComponent implements OnInit {
  public team = new Team(0, '', [
    {name: ''},
    {name: ''},
    {name: ''}
  ]);
  public password = '';

  @ViewChild('dialog') dialog;

  constructor(private route: Router, private model: ModelService) { }

  ngOnInit() {
    this.universalInit();
  }

  universalInit() {

  }

  onSubmit() {
    let members = this.team.members.filter((member) => {
      return member.name !== '';
    }).map((member) => {
      return member.name;
    });

    let body = {
      name: this.team.name,
      password: this.password,
      members: members
    };

    this.model.create(`/api/teams`, body).subscribe(data => {
      this.route.navigate(['/teams']);
    }, (err) => {
      this.dialog.nativeElement.showModal();
    });
  }
}
