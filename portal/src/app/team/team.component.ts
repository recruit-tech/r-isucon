import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { isBrowser } from 'angular2-universal';

import { Observable } from 'rxjs';
import 'rxjs/add/operator/switchMap';

import { Team } from '../shared/model/team.model';
import { SessionService } from '../shared/session.service';
import { ModelService } from '../shared/model/model.service';
import { Score } from '../shared/model/score.model';


@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.Emulated,
  selector: 'app-team',
  templateUrl: 'team.component.html',
  styleUrls: ['team.component.css']
})
export class TeamComponent implements OnInit {
  public isBrowser: boolean;
  public team: Team;
  public scores: Score[];
  public graphOptions: Object;

  constructor(private route: ActivatedRoute, private session: SessionService, private model: ModelService) { }

  ngOnInit() {
    this.universalInit();
  }

  universalInit() {
    this.isBrowser = isBrowser;

    let source = this.route.params
      .switchMap((params: Params) => {
        let id = typeof params['id'] === 'undefined' ? 1 : +params['id'];
        return Observable.of(id);
      });

    source.subscribe((id) => {
      this.model.get(`/api/teams/${id}`)
        .subscribe((teamData: { id: number; name: string; members: string[] }) => {
          let ms = teamData.members.map((member) => {
            return { name: member };
          });
          this.team = new Team(teamData.id, teamData.name, ms);
        });

      this.model.get(`/api/scores/${id}`)
        .subscribe((data: { id: number; score: number; message: string; date: string }[]) => {
          this.graphOptions = {
            size: { height: 400 },
            axis: {
              x: {
                type: 'timeseries',
                localtime: true,
                tick: {
                  format: (x: any) => {
                    // localeが適応されないためハック
                    let d = new Date(x);
                    d.setTime(d.getTime() - d.getTimezoneOffset() * 60 * 1000);
                    let day = '日月火水木金土'[d.getDay()];
                    return `${d.getMonth() + 1}/${d.getDate()}(${day})`;
                  },
                  culling: { max: 6 },
                  count: 6
                }
              },
              y: {
                min: 0,
                padding: 0
              }
            },
            tooltip: {
              format: {
                title: (x) => {
                  // localeが適応されないためハック
                  let d = new Date(x);
                  d.setTime(d.getTime() - d.getTimezoneOffset() * 60 * 1000);
                  let day = '日月火水木金土'[d.getDay()];
                  return `${d.getMonth() + 1}/${d.getDate()}(${day}) ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
                }
              }
            },
            subchart: {
              show: true
            },
            zoom: {
              enabled: true,
              rescale: true,
              extent: [1, 10]
            },
            data: {
              type: 'line',
              x: 'x',
              xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
              columns: [
                [`x`, ...data.map((s) => s.date).reverse()],
                [`${this.team.name}`, ...data.map((s) => s.score).reverse()]
              ]
            }
          };

          if (this.isOwnTeam()) {
            this.scores = data.map((s) => new Score(s.score, s.message, s.date));
          }
        });
    });
  }

  exists() {
    return typeof this.team !== 'undefined';
  }

  isOwnTeam() {
    if (typeof this.team === 'undefined' || !this.session.get('team_id')) {
      return false;
    }

    return this.team['id'] === this.session.get('team_id');
  }
}
