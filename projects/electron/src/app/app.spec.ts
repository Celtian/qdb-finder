import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatSidenavHarness } from '@angular/material/sidenav/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { provideAppVersion } from 'ngx-app-version';
import { BehaviorSubject } from 'rxjs';

import { VERSION_INFO } from '../../../version-info';
import { App } from './app';
import { APP_NAVIGATION_BREAKPOINT, AppNavigationState } from './core/app-navigation-state';

describe('App', () => {
  let breakpoint: BehaviorSubject<BreakpointState>;

  beforeEach(async () => {
    breakpoint = new BehaviorSubject<BreakpointState>({
      matches: false,
      breakpoints: { [APP_NAVIGATION_BREAKPOINT]: false },
    });
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideAppVersion({ version: VERSION_INFO.version }),
        {
          provide: BreakpointObserver,
          useValue: {
            isMatched: () => breakpoint.value.matches,
            observe: () => breakpoint.asObservable(),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders a full-height desktop navigation sidebar and routed content', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const sidenav = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatSidenavHarness);

    expect(fixture.componentInstance).toBeTruthy();
    expect(await sidenav.getMode()).toBe('side');
    expect(await sidenav.isOpen()).toBe(true);
    expect(element.querySelector('app-navigation')).toBeTruthy();
    expect(element.querySelector('main.app-content router-outlet')).toBeTruthy();
    expect(element.querySelector('app-window-titlebar')).toBeNull();
    expect(element.querySelector('[aria-label="Open main navigation"]')).toBeNull();
    expect(fixture.nativeElement.getAttribute('app-version')).toBe(VERSION_INFO.version);
  });

  it('uses a closed overlay drawer on small screens and restores trigger focus on dismissal', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const sidenav = await loader.getHarness(MatSidenavHarness);
    const navigation = TestBed.inject(AppNavigationState);
    const trigger = document.createElement('button');
    document.body.append(trigger);

    breakpoint.next({
      matches: true,
      breakpoints: { [APP_NAVIGATION_BREAKPOINT]: true },
    });
    await fixture.whenStable();
    expect(await sidenav.getMode()).toBe('over');
    expect(await sidenav.isOpen()).toBe(false);

    navigation.open(trigger);
    await fixture.whenStable();
    expect(await sidenav.isOpen()).toBe(true);
    expect(document.activeElement?.classList.contains('primary-navigation-link')).toBe(true);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('.mat-drawer-backdrop')
      ?.click();
    await fixture.whenStable();
    navigation.drawerClosed();
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(await sidenav.isOpen()).toBe(false);
    trigger.remove();
  });

  it('closes the mobile drawer with Escape', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const sidenav = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatSidenavHarness);
    const navigation = TestBed.inject(AppNavigationState);
    const trigger = document.createElement('button');
    document.body.append(trigger);
    breakpoint.next({
      matches: true,
      breakpoints: { [APP_NAVIGATION_BREAKPOINT]: true },
    });
    await fixture.whenStable();
    navigation.open(trigger);
    await fixture.whenStable();

    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    Object.defineProperty(escape, 'keyCode', { value: 27 });
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('mat-sidenav')
      ?.dispatchEvent(escape);
    await fixture.whenStable();

    expect(navigation.mobileOpen()).toBe(false);
    expect(await sidenav.isOpen()).toBe(false);
    trigger.remove();
  });

  it('has no detectable AXE violations in the desktop shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const results = await axe.run(fixture.nativeElement as HTMLElement);
    expect(results.violations).toEqual([]);
  });

  it('has no detectable AXE violations with the mobile drawer open', async () => {
    breakpoint.next({
      matches: true,
      breakpoints: { [APP_NAVIGATION_BREAKPOINT]: true },
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const trigger = document.createElement('button');
    document.body.append(trigger);
    TestBed.inject(AppNavigationState).open(trigger);
    await fixture.whenStable();

    const results = await axe.run(fixture.nativeElement as HTMLElement);
    expect(results.violations).toEqual([]);
    trigger.remove();
  });
});
