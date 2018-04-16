import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Team } from '../shared/model/team.model';
import { ModelService } from '../shared/model/model.service';
import { SessionService } from '../shared/session.service';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.Emulated,
  selector: 'app-team-list',
  templateUrl: 'team-list.component.html',
  styleUrls: ['team-list.component.css']
})
export class TeamListComponent implements OnInit {
  public isLoggedIn = false;
  public teamList: Team[];
  constructor(private router: Router, private session: SessionService, private route: ActivatedRoute, private model: ModelService) {}

  ngOnInit() {
    this.universalInit();
  }

  universalInit() {
    this.session.isLoggedIn$.subscribe(
      (isLoggedIn) => {
        this.isLoggedIn = isLoggedIn;
      }
    );

    this.model.get(`/api/teams`).subscribe((data: {id: number; name: string; members: string[]}[]) => {
      let teamlist = data.map((team) => {
        let ms = team.members.map((member) => { return {name: member}; });
        return new Team(team.id, team.name, ms);
      });
      this.teamList = teamlist;
    });
  }
}
