import { NgModule, Component, ChangeDetectionStrategy, OnInit, OnChanges, Input, ViewChild } from '@angular/core';

import '../../../node_modules/c3/c3.css';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ng-c3',
  template: `<div #chart class="chart"></div>`,
  styles: [
    `.chart {width: 100%;}`,
  ]
})
class ChartComponent implements OnInit, OnChanges {
  private chart: c3.ChartAPI;
  private c3obj: any;

  @ViewChild('chart') elem;
  @Input() options: c3.ChartConfiguration;


  constructor() {
    if (this.isBrowser) {
      this.c3obj = require('c3');
    }
  }

  get isBrowser() {
    return typeof window !== 'undefined';
  }

  ngOnInit() {
    this.update();
  }

  ngOnChanges() {
    this.update();
  }

  update() {
    if (this.isBrowser && this.options) {
      this.options.bindto = this.elem.nativeElement;
      this.chart = this.c3obj.generate(this.options);
    }
  }
}


@NgModule({
  declarations: [
    ChartComponent
  ],
  exports: [
    ChartComponent
  ]
})
export class NgC3Module {}
