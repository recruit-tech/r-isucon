import {
  Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { Team } from '../../shared/model/team.model';
import { ModelService } from '../../shared/model/model.service';
import { SessionService } from '../../shared/session.service';
import { EventHubService } from '../../shared/eventhub.service';


@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.Emulated,
  selector: 'app-edit',
  templateUrl: 'edit.component.html',
  styleUrls: ['edit.component.css']
})
export class EditComponent implements OnInit {
  private teamId: number;
  public team: Team;
  public free = [];
  public enableSubmit = true;

  @ViewChild('dialog') dialog;
  @ViewChild('dialogRelogin') dialogRelogin;

  constructor(
    private cdRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private session: SessionService,
    private model: ModelService,
    private hub: EventHubService) { }

  ngOnInit() {
    this.universalInit();
  }

  universalInit() {
    const access_token = this.session.get('access_token');

    this.route.params
      .switchMap((params: Params) => {
        let id = typeof params['id'] === 'undefined' ? 1 : +params['id'];
        this.teamId = id;

        let headers = { Authorization: 'Yes' };
        return this.model.get(`/api/teams/${id}`, { access_token, date: new Date().getTime() }, headers);
      })
      .subscribe(
        (data: {id: number; name: string; members: string[], host: string; lang: string;}) => {
          let ms = data.members.map((member) => { return {name: member}; });
          this.team = new Team(data.id, data.name, ms, data.host, data.lang);

          for(let i = 0; i < this.team.countFreeMembers(); i++) {
            this.free.push('');
          }

          this.cdRef.detectChanges();
        }, (err) => {
          if (err.status === 401) {
            this.dialogRelogin.nativeElement.showModal();
          }
        }
      );
  }

  onSubmit() {
    this.hub.emit('indeterminate', true);
    this.enableSubmit = false;
    let body = {
      host: this.team.host,
      lang: this.team.lang,
      members: this.free.filter((m) => { return m !== ''; }),
      access_token: this.session.get('access_token')
    };

    this.model.create(`/api/teams/${this.teamId}`, body)
      .finally(() => {
        this.hub.emit('indeterminate', false);
      })
      .subscribe((data) => {
        this.enableSubmit = true;
        this.router.navigate(['/teams', this.teamId]);
      }, (err) => {
        if (err.status === 401) {
          this.dialogRelogin.nativeElement.showModal();
        } else {
          this.dialog.nativeElement.showModal();
        }
        this.enableSubmit = true;
      });
  }

  onClickReLogin() {
    this.router.navigate(['/login']);
    this.session.clear();
  }

  exists() {
    return typeof this.team !== 'undefined';
  }
}
