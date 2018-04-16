import {
  Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, OnDestroy, ViewChild, Inject
} from '@angular/core';
import { Router } from '@angular/router';
import { isBrowser } from 'angular2-universal';

import { Subscription, Observable } from 'rxjs';
import * as d3 from 'd3';

import { isProd } from '../app.module';
import { NotificationService } from '../shared/notification.service';
import { SessionService } from '../shared/session.service';
import { ModelService } from '../shared/model/model.service';
import { SSEService } from '../shared/sse.service';
import { Score } from '../shared/model/score.model';
import { EventHubService } from '../shared/eventhub.service';



@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.Emulated,
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  public isProd: boolean;
  public isBrowser: boolean;
  private subscription: Subscription;
  public isLoggedIn = false;
  public isInSession = false;
  private isInQueue = false;
  public queues = {running: [], waiting: []};
  public disabledRunBenchmarker = true;
  public scores: Score[];
  public splineOptions: Object;
  public barOptions: Object;
  private startDate: string;
  private endDate: string;
  public remain =  {days: 365, hours: 0, minutes: 0, seconds: 0};

  @ViewChild('dialogRelogin') dialogRelogin;
  @ViewChild('dialogFlavor') dialogFlavor;

  constructor(
    @Inject('isProd') isProd: boolean,
    @Inject('startDate') startDate: string,
    @Inject('endDate') endDate: string,
    private route: Router,
    private session: SessionService,
    private model: ModelService,
    private sse: SSEService,
    private notify: NotificationService,
    private hub: EventHubService) {
    this.isProd = isProd;
    this.startDate = startDate;
    this.endDate = endDate;
  }

  ngOnInit() {
    this.universalInit();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  universalInit() {
    this.isBrowser = isBrowser;
    this.disabledRunBenchmarker = !(this.isLoggedIn && this.isInSession && !this.isInQueue);
    this.notify.requestPermission();

    this.subscription = this.session.isLoggedIn$.subscribe(
      (isLoggedIn) => {
        this.isLoggedIn = isLoggedIn;
      }
    );

    if (isBrowser) {
      this.isInSession$().timestamp()
        .subscribe((x) => {
          this.isInSession = x.value;
          let now = x.timestamp;

          const start = new Date(this.startDate).getTime();
          const end = new Date(this.endDate).getTime();
          const day = 24 * 60 * 60 * 1000;
          const left = end - now;

          if (left < 0) {
            this.remain = { days: 0, hours: 0, minutes: 0, seconds: 0 };
          } else if (now - start > 0) {
            this.remain = {
              days: Math.floor(left / day),
              hours: Math.floor((left % day) / (60 * 60 * 1000)),
              minutes: Math.floor((left % day) / (60 * 1000)) % 60,
              seconds: Math.floor((left % day) / 1000) % 60 % 60,
            };
          }

          this.disabledRunBenchmarker = !(this.isLoggedIn && this.isInSession && !this.isInQueue);
        });
    }

    this.model.get('/api/queues').subscribe(
      (data) => {
        this.formatQueues(data);
      }
    );

    this.model.get(`/api/scores`)
      .subscribe((data: {id: number; name: string; scores: {id: number; score: number; message: string; date: string}[]}[]) => {
        this.splineOptions = this.setSplineOptions(data);
        this.barOptions = this.setBarOptions(data);


        if (this.isLoggedIn) {
          let value = data.find((s) => s.id === this.session.get('team_id'));
          if (value) {
            this.scores = value.scores
              .slice(0, 5).map((s) => new Score(s.score, s.message, s.date));
          }
        }
      });

    if (this.isLoggedIn) {
      let observer = this.sse.fromEventSource('/api/benches').share();

      observer
        .delay(new Date(Date.now() + 1000))
        .mergeMap((data: string) => {
          let queries = {date: Date.now()};
          return this.model.get('/api/queues', queries);
        })
        .subscribe(
          (data) => {
            this.formatQueues(data);
          },
          (err) => console.log('err', err)
        );

      observer.filter((data: string) => /started/.test(data))
        .subscribe((data: string) => {
          let json: {team_id: string; status: string;} = JSON.parse(data);
          let teamId = this.session.get('team_id');

          if (json.team_id === teamId) {
            this.notify.sendStarted();
          }
        });

      observer.filter((data: string) => /finished/.test(data))
        .do((data: string) => {
          let json: {team_id: string; status: string;} = JSON.parse(data);
          let teamId = this.session.get('team_id');

          if (json.team_id === teamId) {
            this.notify.sendFinished();
          }
        })
        .delay(new Date(Date.now() + 1000))
        .mergeMap((data: string) => {
          let queries = {date: Date.now()};
          return this.model.get('/api/scores', queries);
        })
        .subscribe(
          (data) => {
            this.splineOptions = this.setSplineOptions(data);
            this.barOptions = this.setBarOptions(data);

            if (this.isLoggedIn) {
              let value = data.find((s) => s.id === this.session.get('team_id'));
              if (value) {
                this.scores = value.scores
                  .slice(0, 5).map((s) => new Score(s.score, s.message, s.date));
              }
            }
          },
          (err) => console.log('err', err)
        );
    }
  }

  onClickRunBenchmarker() {
    this.hub.emit('indeterminate', true);
    this.isInQueue = true;
    let body = {
      access_token: this.session.get('access_token'),
      team_id: this.session.get('team_id')
    };

    this.model.create('/api/queues', body)
      .finally(() => {
        this.hub.emit('indeterminate', false);
      })
      .subscribe(
      (data) => {
        this.formatQueues(data);
      }, (err) => {
        this.isInQueue = false;
        if (err.status === 400) {
          this.dialogFlavor.nativeElement.showModal();
        } else if (err.status === 401) {
          this.dialogRelogin.nativeElement.showModal();
        }
      }
    );
  }

  onClickReLogin() {
    this.route.navigate(['/login']);
    this.session.clear();
  }

  onClickAddApplicationServer() {
    let id = this.session.get('team_id');
    this.route.navigate(['teams', id, 'edit']);
  }

  onClickTeamInfo() {
    let id = this.session.get('team_id');
    this.route.navigate(['teams', id]);
  }

  displayCountDown() {
    if (!this.isBrowser || !this.isProd) {
      return false;
    }

    return this.remain.days < 1 && this.remain.hours < 1;
  }

  private formatQueues(data) {
    this.isInQueue = false;
    for (let i of data.running) {
      if (i.team_id === this.session.get('team_id')) {
        i.self = true;
        this.isInQueue = true;
      }
    }
    for (let i of data.waiting) {
      if (i.team_id === this.session.get('team_id')) {
        i.self = true;
        this.isInQueue = true;
      }
    }
    this.queues = data;
  }

  private setSplineOptions(data: any): c3.ChartConfiguration {
    let options: c3.ChartConfiguration;
    let xs = data.reduce((acc, t) => {
      acc[`${t.name}`] = `${t.name}-x`;
      return acc;
    }, {});

    return {
      size: { height: 400 },
      legend: { show: true },
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
        xs: xs,
        xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
        columns: data.reduce((acc, t) => {
          acc.push([`${t.name}-x`, ...t.scores.map((s) => s.date).reverse()]);
          acc.push([`${t.name}`, ...t.scores.map((s) => s.score).reverse()]);
          return acc;
        }, [])
      }
    };
  }

  private setBarOptions(data: any) {
    const ranking = data.map((t) => {
      return {
        name: t.name,
        score: Math.max(... t.scores.map(s => s.score))
      };
    }).sort((a, b) => {
      return b.score - a.score;
    }).slice(0, 10);

    return {
      size: { height: 400 },
      bar: { width: 20 },
      padding: { left: 120 },
      legend: { show: false },
      axis: {
        rotated: true,
        x: {
          type: 'category',
          categories: ranking.map(r => r.name)
        },
        y: {
          tick: { format: d3.format('s') }
        }
      },
      tooltip: {
        format: {
          value: (v) => {
            let f = d3.format('d');
            return f(v);
          }
        }
      },
      data: {
        type: 'bar',
        columns: [
          ['スコア', ...ranking.map(r => r.score)]
        ],
      }
    };
  }

  private isInSession$(): Observable<boolean> {
    return Observable.interval(1000).timestamp().map((x) => {
      if (!isProd()) {
        return true;
      }

      let now = x.timestamp;
      let start = new Date(this.startDate).getTime();
      let end = new Date(this.endDate).getTime();

      return start <= now && now <= end;
    }).share();
  }
}
