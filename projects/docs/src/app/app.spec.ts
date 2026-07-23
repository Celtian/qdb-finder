import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatNavListHarness, MatNavListItemHarness } from '@angular/material/list/testing';
import { MatSidenavHarness } from '@angular/material/sidenav/testing';
import { MatToolbarHarness } from '@angular/material/toolbar/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAppVersion } from 'ngx-app-version';
import { BehaviorSubject } from 'rxjs';

import { VERSION_INFO } from '../../../version-info';
import { App } from './app';
import { routes } from './app.routes';
import { siteMetadata } from './site-metadata';

describe('App', () => {
  let breakpointState: BehaviorSubject<BreakpointState>;

  beforeEach(async () => {
    breakpointState = new BehaviorSubject<BreakpointState>({
      matches: false,
      breakpoints: { '(max-width: 900px)': false },
    });
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideAppVersion({ version: VERSION_INFO.version }),
        {
          provide: BreakpointObserver,
          useValue: { observe: () => breakpointState.asObservable() },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the app-aligned Material toolbar and desktop navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const toolbar = await loader.getHarness(MatToolbarHarness);
    const sidenav = await loader.getHarness(MatSidenavHarness);
    const navigation = await loader.getHarness(MatNavListHarness);
    const items = await navigation.getItems();
    const projectAction = await loader.getHarness(MatButtonHarness.with({ text: /GitHub/ }));

    expect((await toolbar.getRowsAsText())[0]).toContain('QDB Finder');
    expect(await sidenav.getMode()).toBe('side');
    expect(await sidenav.isOpen()).toBe(true);
    expect(items).toHaveLength(12);
    expect(await Promise.all(items.map((item) => item.getTitle()))).toContain('Players');
    expect(await Promise.all(items.map((item) => item.getTitle()))).toContain(
      'Databases & settings',
    );
    expect(await projectAction.getText()).toContain('GitHub');
  });

  it('opens and closes the overlay navigation on compact screens and restores focus', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const trigger = await loader.getHarness(
      MatButtonHarness.with({ selector: '.navigation-trigger', variant: 'icon' }),
    );
    const sidenav = await loader.getHarness(MatSidenavHarness);
    const installation = await loader.getHarness(
      MatNavListItemHarness.with({ title: 'Installation' }),
    );

    breakpointState.next({
      matches: true,
      breakpoints: { '(max-width: 900px)': true },
    });
    await fixture.whenStable();
    expect(await sidenav.getMode()).toBe('over');
    await vi.waitFor(async () => expect(await sidenav.isOpen()).toBe(false));

    await trigger.focus();
    await trigger.click();
    await fixture.whenStable();
    await vi.waitFor(async () => expect(await sidenav.isOpen()).toBe(true));
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.navigation-trigger')
        ?.getAttribute('aria-expanded'),
    ).toBe('true');

    await installation.click();
    await fixture.whenStable();
    await vi.waitFor(async () => expect(await sidenav.isOpen()).toBe(false));
    await vi.waitFor(async () => expect(await trigger.isFocused()).toBe(true));
  });

  it('marks the routed Material navigation item as active', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await fixture.whenStable();
    await router.navigateByUrl('/players');
    await fixture.whenStable();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const players = await loader.getHarness(MatNavListItemHarness.with({ title: 'Players' }));

    expect(await players.isActivated()).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('a[href="/players"]')
        ?.getAttribute('aria-current'),
    ).toBe('page');
  });

  it('exposes the generated application version on the root element', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(fixture.nativeElement.getAttribute('app-version')).toBe(VERSION_INFO.version);
  });

  it('uses valid generated package and optional Git metadata', () => {
    const versionInfo = VERSION_INFO as {
      version: string;
      date: string;
      author?: { name: string; email: string; url: string };
      git?: { branch: string; commit: string };
    };

    expect(versionInfo.version).toBe(siteMetadata.version);
    expect(Number.isNaN(Date.parse(versionInfo.date))).toBe(false);
    expect(versionInfo.author?.name).toBe('Dominik Hladík');
    if (versionInfo.git) {
      expect(versionInfo.git.branch).toBeTruthy();
      expect(versionInfo.git.commit).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  it('renders versioned project links in a semantic footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('footer');
    const links = [...(footer?.querySelectorAll('a') ?? [])];
    const linkByText = (label: string) =>
      links.find((link) => link.textContent?.trim() === label)?.getAttribute('href');

    expect(footer?.textContent).toContain(`QDB Finder ${siteMetadata.versionLabel}`);
    expect(footer?.textContent).toContain(String(siteMetadata.copyrightYear));
    expect(footer?.querySelector('[aria-label="Project links"]')).toBeTruthy();
    expect(linkByText(`QDB Finder ${siteMetadata.versionLabel}`)).toBe(siteMetadata.links.version);
    expect(linkByText('Latest download')).toBe(siteMetadata.links.latestRelease);
    expect(linkByText('Source')).toBe(siteMetadata.links.repository);
    expect(linkByText('Changelog')).toBe(siteMetadata.links.changelog);
    expect(linkByText('MIT License')).toBe(siteMetadata.links.license);
  });

  it('keeps the footer outside the routed content on every guide', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await fixture.whenStable();

    for (const path of ['/players', '/teams-and-leagues', '/referees-and-stadiums']) {
      await router.navigateByUrl(path);
      await fixture.whenStable();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('main h1')?.textContent).toBeTruthy();
      expect(compiled.querySelector('footer')?.textContent).toContain(siteMetadata.versionLabel);
      expect(compiled.querySelector('main footer')).toBeNull();
    }
  });
});
