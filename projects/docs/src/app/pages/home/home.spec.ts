import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../app.routes';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it.each([
    ['/players', 'Players', 'Position matrix'],
    ['/teams-and-leagues', 'Teams and leagues', 'View all players'],
    ['/referees-and-stadiums', 'Referees and stadiums', 'Stadium finder'],
  ])('renders the focused guide at %s', async (path, heading, detail) => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(path, Home);

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(heading);
    expect(harness.routeNativeElement?.textContent).toContain(detail);
  });

  it('documents shared search workflows with structured content', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/searching', Home);
    const element = harness.routeNativeElement!;

    expect(element.querySelectorAll('section')).toHaveLength(4);
    expect(element.querySelector('ul')).toBeTruthy();
    expect(element.querySelector('[role="note"]')?.textContent).toContain('FIFA 11–15');
    expect(element.querySelector('a[href="/players"]')?.textContent).toContain('Player guide');
    expect(element.textContent).toContain('Contextual finders');
    expect(element.textContent).toContain('numeric Original ID');
  });

  it('documents women data cutoffs for players and referees', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/players', Home);
    expect(harness.routeNativeElement?.textContent).toContain(
      'women player records are available from FIFA 16',
    );

    await harness.navigateByUrl('/referees-and-stadiums', Home);
    expect(harness.routeNativeElement?.textContent).toContain(
      'Women referee data is available from FIFA 16',
    );
  });

  it('renders links, notes, lists and existing command blocks semantically', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/installation', Home);
    const installation = harness.routeNativeElement!;

    expect(installation.querySelector('ul')).toBeTruthy();
    expect(installation.querySelector('[role="note"]')).toBeTruthy();
    expect(installation.querySelector('a[href*="releases/latest"]')).toBeTruthy();

    await harness.navigateByUrl('/development', Home);
    expect(harness.routeNativeElement?.querySelector('pre code')?.textContent).toContain(
      'yarn db:build',
    );
  });

  it('introduces all five connected entity finders', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', Home);
    const text = harness.routeNativeElement?.textContent;

    for (const entity of ['Players', 'Teams', 'Leagues', 'Referees', 'Stadiums']) {
      expect(text).toContain(entity);
    }
  });
});
