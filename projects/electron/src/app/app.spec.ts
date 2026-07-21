import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppVersion } from 'ngx-app-version';

import { VERSION_INFO } from '../../../version-info';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideAppVersion({ version: VERSION_INFO.version })],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('exposes the generated application version on the root element', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(fixture.nativeElement.getAttribute('app-version')).toBe(VERSION_INFO.version);
  });

  it('renders routed content without a custom titlebar or global sidenav', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-window-titlebar')).toBeNull();
    expect(element.querySelector('main.app-content')).toBeTruthy();
    expect(element.querySelector('mat-sidenav-container')).toBeNull();
    expect(element.querySelector('.mobile-navigation-bar')).toBeNull();
  });
});
