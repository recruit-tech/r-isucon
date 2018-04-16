import {Directive, AfterViewChecked} from '@angular/core';
import { isBrowser } from 'angular2-universal';

let componentHandler = {upgradeAllRegistered: () => {}};
if (isBrowser) {
  componentHandler = require('material-design-lite/material');
}

@Directive({
  selector: '[appMdl]'
})
export class MdlDirective implements AfterViewChecked {

  ngAfterViewChecked() {
    if (componentHandler) {
      componentHandler.upgradeAllRegistered();
    }
  }
}
