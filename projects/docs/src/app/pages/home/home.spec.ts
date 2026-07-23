import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCardHarness } from '@angular/material/card/testing';
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
    ['/databases-and-settings', 'Databases and settings', 'Import a custom database'],
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
    expect(element.textContent).toContain('Changes are staged in the drawer');
    expect(element.textContent).toContain('Apply runs one search');
    expect(element.textContent).toContain('Cancel discards the draft');
    expect(element.textContent).toContain('Clear all removes the draft filters');
    expect(element.textContent).toContain('Columns opens a drawer');
    expect(element.textContent).toContain('Applied filters are saved locally');
    expect(element.textContent).toContain('exact-database');
    expect(element.textContent).not.toContain('Filter changes search immediately');
  });

  it('covers database management, imports, themes and saved finder preferences', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/databases-and-settings', Home);
    const element = harness.routeNativeElement!;
    const text = element.textContent;

    expect(element.querySelectorAll('section')).toHaveLength(4);
    expect(element.querySelectorAll('ul')).toHaveLength(1);
    expect(text).toContain('All databases');
    expect(text).toContain('PC format version 8');
    expect(text).toContain('Validation and import can be cancelled');
    expect(text).toContain('source folder or files are never modified');
    expect(text).toContain('system appearance');
    expect(text).toContain('light or dark application theme');
    expect(text).toContain('Reset filters and columns');
    expect(text).toContain('remove all custom databases');
    expect(element.querySelector('a[href="/database"]')?.textContent).toContain(
      'Database generation for developers',
    );
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
    const loader = TestbedHarnessEnvironment.loader(harness.fixture);
    const note = await loader.getHarness(MatCardHarness.with({ selector: '.note' }));
    const release = await loader.getHarness(
      MatButtonHarness.with({ text: /Open the latest release/ }),
    );

    expect(installation.querySelector('ul')).toBeTruthy();
    expect(installation.querySelector('[role="note"]')).toBeTruthy();
    expect(installation.querySelector('a[href*="releases/latest"]')).toBeTruthy();
    expect(await note.getText()).toContain('offline-first');
    expect(await release.getAppearance()).toBe('outlined');

    await harness.navigateByUrl('/development', Home);
    const commandCard = await loader.getHarness(MatCardHarness.with({ selector: '.code-card' }));
    expect(harness.routeNativeElement?.querySelector('pre code')?.textContent).toContain(
      'yarn db:build',
    );
    expect(await commandCard.getText()).toContain('yarn build');
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
