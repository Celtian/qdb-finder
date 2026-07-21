import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { provideRouter, Router } from '@angular/router';
import axe from 'axe-core';
import { BehaviorSubject } from 'rxjs';
import { APP_NAVIGATION_BREAKPOINT, AppNavigationState } from '../app-navigation-state';
import { AppNavigation } from './app-navigation';

describe('AppNavigation', () => {
  let fixture: ComponentFixture<AppNavigation>;
  let breakpoint: BehaviorSubject<BreakpointState>;
  let documentLoader: HarnessLoader;
  let router: Router;

  beforeEach(async () => {
    breakpoint = new BehaviorSubject<BreakpointState>({
      matches: false,
      breakpoints: { [APP_NAVIGATION_BREAKPOINT]: false },
    });
    await TestBed.configureTestingModule({
      imports: [AppNavigation],
      providers: [
        provideRouter([
          { path: '', pathMatch: 'full', children: [] },
          { path: 'players', children: [] },
          { path: 'teams', children: [] },
          { path: 'leagues', children: [] },
          { path: 'referees', children: [] },
          { path: 'stadiums', children: [] },
          { path: 'databases', children: [] },
        ]),
        {
          provide: BreakpointObserver,
          useValue: {
            isMatched: () => breakpoint.value.matches,
            observe: () => breakpoint.asObservable(),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppNavigation);
    documentLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('renders the brand, seven destinations and separated About action', () => {
    const element = fixture.nativeElement as HTMLElement;
    const links = [...element.querySelectorAll<HTMLAnchorElement>('nav a')];
    const icons = links.map((link) => link.querySelector('mat-icon')?.textContent?.trim());

    expect(element.querySelector('.brand')?.textContent).toContain('QDB Finder');
    expect(
      links.map((link) => link.querySelector('.mdc-button__label span')?.textContent?.trim()),
    ).toEqual(['Home', 'Players', 'Teams', 'Leagues', 'Referees', 'Stadiums', 'Databases']);
    expect(icons).toEqual([
      'home',
      'groups',
      'shield',
      'emoji_events',
      'sports',
      'stadium',
      'storage',
    ]);
    expect(element.querySelector('.about-action mat-divider')).toBeTruthy();
    expect(element.querySelector('.about-action button')?.textContent).toContain('About');
  });

  it('navigates and marks only the active destination as the current page', async () => {
    await router.navigateByUrl('/players');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('a[href="/players"]')?.getAttribute('aria-current')).toBe('page');
    expect(element.querySelector('a[href="/"]')?.hasAttribute('aria-current')).toBe(false);

    breakpoint.next({
      matches: true,
      breakpoints: { [APP_NAVIGATION_BREAKPOINT]: true },
    });
    await fixture.whenStable();
    const navigation = TestBed.inject(AppNavigationState);
    navigation.open(document.createElement('button'));
    element.querySelector<HTMLAnchorElement>('a[href="/teams"]')?.click();
    await fixture.whenStable();
    expect(router.url).toBe('/teams');
    expect(navigation.mobileOpen()).toBe(false);
  });

  it('opens About and restores the mobile hamburger after the dialog closes', async () => {
    breakpoint.next({
      matches: true,
      breakpoints: { [APP_NAVIGATION_BREAKPOINT]: true },
    });
    await fixture.whenStable();
    const navigation = TestBed.inject(AppNavigationState);
    const trigger = document.createElement('button');
    document.body.append(trigger);
    navigation.open(trigger);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.about-action button')
      ?.click();
    await fixture.whenStable();
    expect(navigation.mobileOpen()).toBe(false);
    const dialog = await documentLoader.getHarness(MatDialogHarness);
    expect(await dialog.getTitleText()).toBe('QDB Finder');

    await (await dialog.getHarness(MatButtonHarness.with({ text: 'Close' }))).click();
    await fixture.whenStable();
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
    trigger.remove();
  });

  it('has no detectable AXE violations', async () => {
    const results = await axe.run(fixture.nativeElement as HTMLElement);
    expect(results.violations).toEqual([]);
  });
});
