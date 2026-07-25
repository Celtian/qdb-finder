import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TestKey } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';
import {
  defaultFinderColumnPreference,
  finderColumns,
  type FinderColumnDefinition,
  type FinderColumnPreference,
} from '../../core/finder-columns';
import {
  FinderPreferences,
  finderColumnPreferenceKey,
  finderFilterPreferenceKey,
} from '../../core/finder-preferences';
import { FinderColumnLayouts } from './finder-column-layouts';

describe('FinderColumnLayouts', () => {
  let fixture: ComponentFixture<FinderColumnLayouts>;
  const snackBarOpen = vi.fn();

  const createComponent = async (): Promise<void> => {
    fixture = TestBed.createComponent(FinderColumnLayouts);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    window.localStorage.clear();
    snackBarOpen.mockClear();
    await TestBed.configureTestingModule({
      imports: [FinderColumnLayouts],
      providers: [{ provide: MatSnackBar, useValue: { open: snackBarOpen } }],
    }).compileComponents();
  });

  it('shows all finder tabs and loads the saved layout for the active finder', async () => {
    const preference: FinderColumnPreference = {
      version: 2,
      order: [
        'country',
        'name',
        ...defaultFinderColumnPreference('leagues').order.filter(
          (column) => column !== 'country' && column !== 'name',
        ),
      ],
      visible: ['country', 'name'],
    };
    TestBed.inject(FinderPreferences).saveColumnPreference('leagues', preference);
    await createComponent();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const tabs = await loader.getHarness(MatTabGroupHarness);
    const labels = await Promise.all((await tabs.getTabs()).map((tab) => tab.getLabel()));
    const checkboxes = await loader.getAllHarnesses(MatCheckboxHarness);

    expect(labels).toEqual(['Leagues', 'Teams', 'Players', 'Referees', 'Stadiums']);
    expect(await (await tabs.getSelectedTab()).getLabel()).toBe('Leagues');
    expect(
      await Promise.all(checkboxes.slice(0, 2).map((checkbox) => checkbox.getLabelText())),
    ).toEqual(['Country', 'League']);
    const name = await loader.getHarness(MatCheckboxHarness.with({ label: 'League' }));
    expect(await name.isChecked()).toBe(true);
    expect(await name.isDisabled()).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('mat-card.column-layouts')
        ?.classList.contains('mat-mdc-card-outlined'),
    ).toBe(false);
    expect([...(fixture.nativeElement as HTMLElement).querySelectorAll('mat-card')].length).toBe(2);
  });

  it('offers a reset action for every finder tab', async () => {
    await createComponent();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const tabs = await loader.getHarness(MatTabGroupHarness);
    const expected = [
      ['Leagues', 'Reset league columns'],
      ['Teams', 'Reset team columns'],
      ['Players', 'Reset player columns'],
      ['Referees', 'Reset referee columns'],
      ['Stadiums', 'Reset stadium columns'],
    ] as const;

    for (const [tabLabel, buttonLabel] of expected) {
      await tabs.selectTab({ label: tabLabel });
      await fixture.whenStable();
      expect(await loader.hasHarness(MatButtonHarness.with({ text: buttonLabel }))).toBe(true);
    }
  });

  it('saves visibility and keyboard ordering changes immediately', async () => {
    await createComponent();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const tabs = await loader.getHarness(MatTabGroupHarness);
    await tabs.selectTab({ label: 'Teams' });
    await fixture.whenStable();
    expect(await (await tabs.getSelectedTab()).getTextContent()).toContain('Squad');

    const squad = await loader.getHarness(MatCheckboxHarness.with({ label: 'Squad' }));
    await squad.uncheck();
    const national = await loader.getHarness(MatCheckboxHarness.with({ label: 'National' }));
    await national.check();
    const nationalHandle = await loader.getHarness(
      MatButtonHarness.with({
        selector: 'button[aria-label="Reorder National column"]',
      }),
    );
    await (await nationalHandle.host()).sendKeys(TestKey.UP_ARROW, TestKey.UP_ARROW);
    await fixture.whenStable();

    const stored = JSON.parse(
      window.localStorage.getItem(finderColumnPreferenceKey('teams')) ?? '',
    ) as FinderColumnPreference;
    expect(stored.order.slice(0, 6)).toEqual([
      'name',
      'originalId',
      'database',
      'national',
      'version',
      'country',
    ]);
    expect(stored.visible).toContain('national');
    expect(stored.visible).not.toContain('squadSize');
    expect(stored.visible).toContain('name');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'National moved to position 4',
    );
  });

  it('saves pointer ordering and announces list boundaries', async () => {
    await createComponent();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const tabs = await loader.getHarness(MatTabGroupHarness);
    await tabs.selectTab({ label: 'Players' });
    await fixture.whenStable();
    expect(await (await tabs.getSelectedTab()).getTextContent()).toContain('Positions');

    const testable = fixture.componentInstance as unknown as {
      drop(finder: 'players', event: CdkDragDrop<readonly FinderColumnDefinition[]>): void;
    };
    testable.drop('players', {
      previousIndex: 1,
      currentIndex: 4,
    } as CdkDragDrop<readonly FinderColumnDefinition[]>);
    await fixture.whenStable();

    const stored = JSON.parse(
      window.localStorage.getItem(finderColumnPreferenceKey('players')) ?? '',
    ) as FinderColumnPreference;
    expect(stored.order.slice(0, 5)).toEqual([
      'name',
      'database',
      'version',
      'nationality',
      'originalId',
    ]);

    const firstHandle = await loader.getHarness(
      MatButtonHarness.with({
        selector: 'button[aria-label="Reorder Player column"]',
      }),
    );
    await (await firstHandle.host()).sendKeys(TestKey.UP_ARROW);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Player is already the first column.',
    );
  });

  it('resets one finder layout without changing other layouts or filters', async () => {
    const preferences = TestBed.inject(FinderPreferences);
    preferences.saveColumnPreference('leagues', {
      version: 2,
      order: finderColumns.leagues.map(({ key }) => key),
      visible: ['name'],
    });
    preferences.saveColumnPreference('teams', {
      version: 2,
      order: finderColumns.teams.map(({ key }) => key),
      visible: ['name'],
    });
    window.localStorage.setItem(finderFilterPreferenceKey('leagues'), '{}');
    const storedTeams = window.localStorage.getItem(finderColumnPreferenceKey('teams'));
    await createComponent();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const originalId = await loader.getHarness(MatCheckboxHarness.with({ label: 'Original ID' }));
    expect(await originalId.isChecked()).toBe(false);

    await (
      await loader.getHarness(MatButtonHarness.with({ text: 'Reset league columns' }))
    ).click();
    await fixture.whenStable();

    expect(window.localStorage.getItem(finderColumnPreferenceKey('leagues'))).toBeNull();
    expect(window.localStorage.getItem(finderColumnPreferenceKey('teams'))).toBe(storedTeams);
    expect(window.localStorage.getItem(finderFilterPreferenceKey('leagues'))).not.toBeNull();
    expect(await originalId.isChecked()).toBe(true);
    expect(snackBarOpen).toHaveBeenCalledWith('Leagues column layout reset.', 'Dismiss', {
      duration: 3000,
    });
  });

  it('resets every column layout without changing filters, theme or unrelated storage', async () => {
    for (const finder of ['players', 'teams', 'leagues', 'referees', 'stadiums'] as const) {
      window.localStorage.setItem(finderColumnPreferenceKey(finder), '{}');
    }
    window.localStorage.setItem(finderFilterPreferenceKey('players'), '{}');
    window.localStorage.setItem('qdb-finder.theme', 'dark');
    window.localStorage.setItem('unrelated', 'preserved');
    await createComponent();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    await (
      await loader.getHarness(MatButtonHarness.with({ text: 'Reset all column layouts' }))
    ).click();
    await fixture.whenStable();

    for (const finder of ['players', 'teams', 'leagues', 'referees', 'stadiums'] as const) {
      expect(window.localStorage.getItem(finderColumnPreferenceKey(finder))).toBeNull();
    }
    expect(window.localStorage.getItem(finderFilterPreferenceKey('players'))).not.toBeNull();
    expect(window.localStorage.getItem('qdb-finder.theme')).toBe('dark');
    expect(window.localStorage.getItem('unrelated')).toBe('preserved');
    expect(snackBarOpen).toHaveBeenCalledWith('Finder column layouts reset.', 'Dismiss', {
      duration: 3000,
    });
  });

  it('reports per-finder and reset-all storage failures', async () => {
    const preferences = TestBed.inject(FinderPreferences);
    vi.spyOn(preferences, 'resetColumns').mockReturnValue(false);
    vi.spyOn(preferences, 'resetAllColumns').mockReturnValue(false);
    await createComponent();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    await (
      await loader.getHarness(MatButtonHarness.with({ text: 'Reset league columns' }))
    ).click();
    await (
      await loader.getHarness(MatButtonHarness.with({ text: 'Reset all column layouts' }))
    ).click();

    expect(snackBarOpen).toHaveBeenNthCalledWith(
      1,
      'Leagues column layout could not be reset.',
      'Dismiss',
      { duration: 6000 },
    );
    expect(snackBarOpen).toHaveBeenNthCalledWith(
      2,
      'Finder column layouts could not be reset.',
      'Dismiss',
      { duration: 6000 },
    );
  });
});
