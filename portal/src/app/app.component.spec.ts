/* tslint:disable:no-unused-variable */

import { Component, NgModule } from '@angular/core';
import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';

@Component({
  template: ''
})
class MockHomeComponent { }

@Component({
  template: ''
})
class MockTeamsComponent { }

@NgModule({
  declarations: [ MockHomeComponent, MockTeamsComponent ],
  exports:      [ MockHomeComponent, MockTeamsComponent ]
})
class MockModule { }


describe('App: Y!SUCON Portal', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      imports: [
        MockModule,
        RouterTestingModule
      ]
    });
  });

  it(`'Y!SUCON Portal'のtitleタグが表示できていること`, async(() => {
    let fixture = TestBed.createComponent(AppComponent);
    let app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('Y!SUCON Portal');
  }));

  it(`headerのタイトルとして'Y!SUCON Portalが表示できていること`, async(() => {
    let fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    let compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.mdl-layout-title').textContent).toContain('Y!SUCON Portal');
  }));
});
