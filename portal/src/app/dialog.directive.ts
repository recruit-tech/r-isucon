import { Directive, ElementRef, OnInit } from '@angular/core';
import { isBrowser } from 'angular2-universal';

import dialogPolyfill from 'dialog-polyfill';

@Directive({
  selector: '[appDialog]'
})
export class DialogDirective implements OnInit {
  constructor(private elm: ElementRef) {
  }

  ngOnInit() {
    this.universalInit();
  }

  universalInit() {
    if (isBrowser) {
      dialogPolyfill.registerDialog(this.elm.nativeElement);
    }
  }
}
