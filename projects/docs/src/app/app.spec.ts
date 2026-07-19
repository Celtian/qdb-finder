import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { siteMetadata } from './site-metadata';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render documentation navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const navigation = compiled.querySelector('[aria-label="Documentation pages"]');

    expect(navigation?.textContent).toContain('Installation');
    expect(navigation?.textContent).toContain('Players');
    expect(navigation?.textContent).toContain('Teams & leagues');
    expect(navigation?.textContent).toContain('Referees & stadiums');
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
