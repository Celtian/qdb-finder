import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Qdb } from '../../core/qdb';
import { DatabaseContext } from '../../core/database-context';
import type { FinderColumnKey } from '../../core/finder-columns';
import {
  finderColumnPreferenceKey,
  finderFilterPreferenceKey,
} from '../../core/finder-preferences';
import type {
  FilterSuggestion,
  PlayerDetails,
  PlayerSearchRow,
  SearchRequest,
  SearchResultPage,
} from '../../core/qdb-contracts';
import { PlayerFinder } from './player-finder';

describe('PlayerFinder', () => {
  let component: PlayerFinder;
  let fixture: ComponentFixture<PlayerFinder>;
  const searchPlayers = vi.fn(async () => ({
    rows: [],
    total: 0,
    offset: 0,
    pageSize: 50,
  }));
  const suggestFilters = vi.fn(async (): Promise<FilterSuggestion[]> => []);
  const getPlayer = vi.fn(async (): Promise<PlayerDetails> => ({}) as PlayerDetails);

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PlayerFinder],
      providers: [
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            searchPlayers,
            suggestFilters,
            getPlayer,
            getTeam: vi.fn(),
            getLeague: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    searchPlayers.mockClear();
    suggestFilters.mockReset();
    suggestFilters.mockResolvedValue([]);
    getPlayer.mockClear();
    fixture = TestBed.createComponent(PlayerFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-navigation-trigger'),
    ).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('.search')?.textContent).toContain(
      'Search players, teams, leagues, countries or Original ID',
    );
  });

  it('keeps Filters and Columns available in loading, error, and empty states', async () => {
    const testable = component as unknown as {
      loading: { set(value: boolean): void };
      error: { set(value: string): void };
    };
    const expectControls = (): void => {
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('.filter-button')).toBeTruthy();
      expect(element.querySelector('.column-button')).toBeTruthy();
    };

    testable.loading.set(true);
    await fixture.whenStable();
    expectControls();
    testable.loading.set(false);
    testable.error.set('Unavailable');
    await fixture.whenStable();
    expectControls();
    testable.error.set('');
    await fixture.whenStable();
    expectControls();
  });

  it('counts active filter groups and preserves search text when clearing the draft', async () => {
    const testable = component as unknown as {
      request: {
        (): SearchRequest;
        update(update: (value: SearchRequest) => SearchRequest): void;
      };
      draftRequest(): SearchRequest;
      activeFilterCount(): number;
      model: { set(value: { text: string }): void };
      columns(): readonly FinderColumnKey[];
      openFilters(): void;
      setGender(value: 'all' | 'men' | 'women'): void;
      clearDraftFilters(): void;
      applyFilters(): void;
    };
    testable.request.update((value) => ({
      ...value,
      text: 'Messi',
      databaseIds: ['built-in'],
      versions: [23],
      nationalities: ['argentina', 'spain'],
      age: { min: 20, max: 30 },
    }));
    testable.model.set({ text: 'Messi' });

    expect(testable.activeFilterCount()).toBe(4);
    const columns = testable.columns();
    testable.openFilters();
    await fixture.whenStable();
    testable.setGender('women');
    TestBed.inject(MatDialog).closeAll();
    await fixture.whenStable();
    expect(testable.request().gender).toBeUndefined();

    testable.openFilters();
    await fixture.whenStable();
    expect(testable.draftRequest().gender).toBeUndefined();
    testable.clearDraftFilters();
    testable.applyFilters();
    await fixture.whenStable();

    expect(testable.request()).toMatchObject({ text: 'Messi', offset: 0 });
    expect(testable.request().databaseIds).toEqual([]);
    expect(testable.request().versions).toEqual([]);
    expect(testable.request().nationalities).toEqual([]);
    expect(testable.columns()).toEqual(columns);
    expect(
      JSON.parse(window.localStorage.getItem(finderFilterPreferenceKey('players')) ?? '').filters,
    ).toMatchObject({ databaseIds: [], versions: [], nationalities: [] });
  });

  it('sorts the newest FIFA editions first by default', () => {
    const testable = component as unknown as {
      request(): SearchRequest;
    };

    expect(testable.request()).toMatchObject({ sort: 'version', direction: 'desc' });
  });

  it('persists visible columns and resets a hidden active sort without clearing filters', async () => {
    const testable = component as unknown as {
      columns(): readonly FinderColumnKey[];
      hiddenColumnCount(): number;
      request: {
        (): SearchRequest;
        update(update: (value: SearchRequest) => SearchRequest): void;
      };
      applyColumns(columns: readonly FinderColumnKey[]): void;
    };
    testable.request.update((value) => ({ ...value, versions: [23], offset: 50 }));
    searchPlayers.mockClear();

    testable.applyColumns(['name', 'birthDate']);
    await fixture.whenStable();

    expect(testable.columns()).toEqual(['name', 'birthDate']);
    expect(testable.hiddenColumnCount()).toBe(14);
    expect(testable.request()).toMatchObject({
      versions: [23],
      sort: 'name',
      direction: 'asc',
      offset: 0,
    });
    expect(searchPlayers).toHaveBeenCalledWith(
      expect.objectContaining({ versions: [23], sort: 'name', direction: 'asc', offset: 0 }),
    );
    expect(
      JSON.parse(window.localStorage.getItem(finderColumnPreferenceKey('players')) ?? ''),
    ).toEqual(['name', 'birthDate']);
  });

  it('restores persisted columns and reconciles a hidden default sort on creation', async () => {
    fixture.destroy();
    window.localStorage.setItem(
      finderColumnPreferenceKey('players'),
      JSON.stringify(['name', 'birthDate']),
    );

    const restoredFixture = TestBed.createComponent(PlayerFinder);
    await restoredFixture.whenStable();
    const restored = restoredFixture.componentInstance as unknown as {
      columns(): readonly FinderColumnKey[];
      request(): SearchRequest;
    };

    expect(restored.columns()).toEqual(['name', 'birthDate']);
    expect(restored.request()).toMatchObject({ sort: 'name', direction: 'asc' });
    restoredFixture.destroy();
  });

  it('refreshes against a changed database catalog without clearing filters', async () => {
    const testable = component as unknown as {
      request: {
        (): SearchRequest;
        update(update: (value: SearchRequest) => SearchRequest): void;
      };
      versions(): number[];
    };
    testable.request.update((value) => ({ ...value, positions: ['ST'] }));
    searchPlayers.mockClear();

    TestBed.inject(DatabaseContext).set(
      [
        {
          id: 'custom-id',
          name: 'Custom FIFA 23',
          kind: 'custom',
          schemaVersion: 1,
          editions: 1,
          teamEditions: 1,
          leagueEditions: 1,
          refereeEditions: 1,
          stadiumEditions: 1,
          teamLinks: 1,
          sourceFiles: 11,
          versions: [23],
          generatedAt: '2026-07-20T00:00:00.000Z',
          sqliteVersion: '3.50.0',
          status: 'available',
        },
      ],
      true,
    );
    await fixture.whenStable();

    expect(testable.versions()).toEqual([23]);
    expect(searchPlayers).toHaveBeenCalledWith(expect.objectContaining({ positions: ['ST'] }));
  });

  it('stages gender until Apply and resets pagination without changing editions', async () => {
    const testable = component as unknown as {
      request: {
        (): SearchRequest;
        update(update: (value: SearchRequest) => SearchRequest): void;
      };
      openFilters(): void;
      applyFilters(): void;
      setGender(value: 'all' | 'men' | 'women'): void;
    };
    testable.request.update((value) => ({ ...value, versions: [15], offset: 50 }));
    searchPlayers.mockClear();

    testable.openFilters();
    await fixture.whenStable();
    searchPlayers.mockClear();
    testable.setGender('women');

    expect(searchPlayers).not.toHaveBeenCalled();
    const hint = document.body.querySelector('mat-hint');
    expect(document.body.textContent).toContain('Women available from FIFA 16');
    expect(hint?.closest('mat-form-field')?.classList.contains('filter-with-hint')).toBe(true);
    testable.applyFilters();
    await fixture.whenStable();

    expect(searchPlayers).toHaveBeenCalledWith(
      expect.objectContaining({ versions: [15], gender: 'women', offset: 0 }),
    );
    testable.openFilters();
    await fixture.whenStable();
    testable.setGender('all');
    testable.applyFilters();
    await fixture.whenStable();

    expect(testable.request().gender).toBeUndefined();
  });

  it('stages number ranges and searches once on Apply', async () => {
    const testable = component as unknown as { openFilters(): void; applyFilters(): void };
    testable.openFilters();
    await fixture.whenStable();
    const ageMin = document.body.querySelector<HTMLInputElement>(
      '.finder-filter-drawer-panel fieldset input',
    );
    expect(ageMin).toBeTruthy();
    searchPlayers.mockClear();

    ageMin!.value = '21';
    ageMin!.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(searchPlayers).not.toHaveBeenCalled();
    testable.applyFilters();
    await fixture.whenStable();
    expect(searchPlayers).toHaveBeenCalledWith(
      expect.objectContaining({ age: { min: 21 }, offset: 0 }),
    );
    expect(searchPlayers).toHaveBeenCalledTimes(1);
  });

  it('keeps suggestion labels while searching with canonical lowercase keys', async () => {
    const testable = component as unknown as {
      addExactFilter(field: 'teams', option: FilterSuggestion, input: HTMLInputElement): void;
      filterLabel(field: 'teams', key: string): string;
      openFilters(): void;
      applyFilters(): void;
    };
    const input = document.createElement('input');
    searchPlayers.mockClear();

    testable.openFilters();
    testable.addExactFilter(
      'teams',
      { key: 'olympique lyonnais', label: 'Olympique Lyonnais', count: 1 },
      input,
    );
    expect(testable.filterLabel('teams', 'olympique lyonnais')).toBe('Olympique Lyonnais');
    expect(searchPlayers).not.toHaveBeenCalled();
    testable.applyFilters();
    await fixture.whenStable();
    expect(searchPlayers).toHaveBeenCalledWith(
      expect.objectContaining({ teams: ['olympique lyonnais'] }),
    );
  });

  it('keeps a Nations-table code with the selected nationality chip', async () => {
    const testable = component as unknown as {
      addExactFilter(
        field: 'nationalities',
        option: FilterSuggestion,
        input: HTMLInputElement,
      ): void;
      nationalityCode(key: string): string;
      openFilters(): void;
    };

    testable.openFilters();
    await fixture.whenStable();
    testable.addExactFilter(
      'nationalities',
      { key: 'brazil', label: 'Brazil', count: 1, nationalityCode: 'br' },
      document.createElement('input'),
    );
    await fixture.whenStable();

    expect(testable.nationalityCode('brazil')).toBe('br');
    const flag = document.body.querySelector('mat-chip app-country-flag img');
    expect(flag?.getAttribute('ng-reflect-ng-src') ?? flag?.getAttribute('src')).toContain(
      'flags/20x15/br.png',
    );
  });

  it('renders flags in nationality autocomplete options', async () => {
    suggestFilters.mockResolvedValue([
      { key: 'brazil', label: 'Brazil', count: 100, nationalityCode: 'br' },
    ]);
    const testable = component as unknown as { openFilters(): void };
    testable.openFilters();
    await fixture.whenStable();
    const nationalityInput = document.body.querySelector<HTMLInputElement>(
      '.finder-filter-drawer-panel input',
    );

    expect(nationalityInput).toBeTruthy();
    nationalityInput!.focus();
    nationalityInput!.dispatchEvent(new Event('focus'));
    await fixture.whenStable();
    nationalityInput!.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(document.body.querySelector('mat-option app-country-flag')).toBeTruthy();
  });

  it('renders the database nationality code beside result text', async () => {
    const testable = component as unknown as {
      columns: { set(value: readonly FinderColumnKey[]): void };
      loading: { set(value: boolean): void };
      result: {
        set(value: SearchResultPage): void;
      };
    };
    testable.loading.set(false);
    const testableResultRow: PlayerSearchRow = {
      key: 'internal-player-key',
      databaseId: 'built-in',
      databaseName: 'Built-in FIFA 11–23',
      version: 23,
      playerId: 123_456,
      name: 'Test Player',
      nationality: 'Brazil',
      nationalityCode: 'br',
      teams: [],
      leagues: [],
      positions: ['ST'],
      birthDate: '2004-02-29',
      contractValidUntil: 2027,
      age: 20,
      height: 180,
      weight: 75,
      preferredFoot: '1',
      overall: 80,
      potential: 85,
      bestPosition: 'ST',
      bestRating: 82,
    };
    testable.result.set({
      rows: [testableResultRow],
      total: 1,
      offset: 0,
      pageSize: 50,
    });
    await fixture.whenStable();

    const nationalityCell = (fixture.nativeElement as HTMLElement).querySelector(
      'td.cdk-column-nationality',
    );
    expect(nationalityCell?.textContent).toContain('Brazil');
    expect(nationalityCell?.querySelector('app-country-flag')).toBeTruthy();
    const element = fixture.nativeElement as HTMLElement;
    const headers = [...element.querySelectorAll<HTMLElement>('th.mat-mdc-header-cell')].map(
      (header) => header.textContent?.trim(),
    );
    const originalIdHeader = element.querySelector<HTMLElement>('th.cdk-column-originalId');
    const originalIdCell = element.querySelector<HTMLElement>('td.cdk-column-originalId');
    expect(headers.slice(0, 4)).toEqual(['Player', 'Original ID', 'Edition', 'Nationality']);
    expect(originalIdHeader?.querySelector('.mat-sort-header-container')).toBeNull();
    expect(originalIdCell?.textContent?.trim()).toBe('123456');
    expect(originalIdCell?.classList.contains('original-id')).toBe(true);
    const birthDateCell = element.querySelector<HTMLElement>('td.cdk-column-birthDate');
    expect(birthDateCell?.textContent?.trim()).toBe('29 Feb 2004');
    expect(getComputedStyle(originalIdHeader!).whiteSpace).toBe('nowrap');
    expect(getComputedStyle(birthDateCell!).whiteSpace).toBe('nowrap');
    expect(element.querySelector('td.cdk-column-database')).toBeNull();
    expect(element.querySelector('td.cdk-column-teams')).toBeNull();
    expect(element.querySelector('td.cdk-column-contractValidUntil')).toBeNull();
    expect(element.querySelector('td.cdk-column-age')).toBeNull();
    expect(element.querySelector('td.cdk-column-height')?.textContent?.trim()).toBe('180 cm');
    expect(element.querySelector('td.cdk-column-weight')?.textContent?.trim()).toBe('75 kg');
    expect(element.querySelector('td.cdk-column-preferredFoot')?.textContent?.trim()).toBe('Right');
    expect(element.querySelector('.column-button')?.getAttribute('aria-label')).toBe(
      'Choose columns, 4 hidden',
    );
    expect(element.querySelector('td.cdk-column-overall .data-badge.score-lime')).toBeTruthy();
    expect(element.querySelector('td.cdk-column-potential .data-badge.score-green')).toBeTruthy();
    expect(
      element.querySelector('td.cdk-column-positions .data-badge.position-attacker'),
    ).toBeTruthy();
    expect(
      element.querySelector('td.cdk-column-bestRating .data-badge.position-attacker'),
    ).toBeTruthy();

    testable.result.set({
      rows: [
        {
          ...testableResultRow,
          birthDate: null,
          height: null,
          weight: null,
          preferredFoot: '',
        },
      ],
      total: 1,
      offset: 0,
      pageSize: 50,
    });
    await fixture.whenStable();
    expect(element.querySelector('td.cdk-column-birthDate')?.textContent?.trim()).toBe('—');
    expect(element.querySelector('td.cdk-column-height')?.textContent?.trim()).toBe('—');
    expect(element.querySelector('td.cdk-column-weight')?.textContent?.trim()).toBe('—');
    expect(element.querySelector('td.cdk-column-preferredFoot')?.textContent?.trim()).toBe('—');

    testable.result.set({
      rows: [{ ...testableResultRow, nationality: 'Unknown nation', nationalityCode: '' }],
      total: 1,
      offset: 0,
      pageSize: 50,
    });
    await fixture.whenStable();

    const missingFlagCell = element.querySelector('td.cdk-column-nationality');
    expect(missingFlagCell?.textContent).toContain('Unknown nation');
    expect(missingFlagCell?.querySelector('app-country-flag')).toBeNull();

    testable.columns.set(['name', 'originalId', 'database', 'birthDate', 'contractValidUntil']);
    await fixture.whenStable();
    const databaseCell = element.querySelector<HTMLElement>('td.cdk-column-database');
    const contractCell = element.querySelector<HTMLElement>('td.cdk-column-contractValidUntil');
    expect(databaseCell?.textContent?.trim()).toBe('Built-in FIFA 11–23');
    expect(contractCell?.textContent?.trim()).toBe('2027');
    expect(getComputedStyle(databaseCell!).whiteSpace).toBe('nowrap');
    expect(getComputedStyle(contractCell!).whiteSpace).toBe('nowrap');

    testable.result.set({
      rows: [{ ...testableResultRow, contractValidUntil: null }],
      total: 1,
      offset: 0,
      pageSize: 50,
    });
    await fixture.whenStable();
    expect(
      element.querySelector<HTMLElement>('td.cdk-column-contractValidUntil')?.textContent?.trim(),
    ).toBe('—');
  });

  it('supports the complete filter, paging, sorting and detail workflow', async () => {
    const input = document.createElement('input');
    const suggestion = { key: 'arsenal', label: 'Arsenal', count: 1 };
    const row = {
      key: '23:1',
      databaseId: 'built-in',
      databaseName: 'Built-in FIFA 11–23',
      version: 23,
      playerId: 1,
      name: 'Test Player',
      nationality: 'England',
      nationalityCode: 'gb-eng',
      teams: ['Arsenal'],
      leagues: ['Premier League'],
      positions: ['ST'],
      birthDate: '2004-02-29',
      contractValidUntil: 2027,
      age: 20,
      height: 180,
      weight: 75,
      preferredFoot: '1',
      overall: 80,
      potential: 85,
      bestPosition: 'ST',
      bestRating: 82,
    } satisfies PlayerSearchRow;
    const testable = component as unknown as {
      request(): SearchRequest;
      error(): string;
      setVersions(versions: number[]): void;
      setPositions(positions: string[]): void;
      setRange(kind: 'age' | 'overall' | 'potential', boundary: 'min' | 'max', event: Event): void;
      suggest(kind: 'nationality' | 'team' | 'league', event: Event): Promise<void>;
      addExactFilter(
        field: 'nationalities' | 'teams' | 'leagues',
        option: FilterSuggestion,
        input: HTMLInputElement,
      ): void;
      removeExactFilter(field: 'nationalities' | 'teams' | 'leagues', key: string): void;
      filterLabel(field: 'teams', key: string): string;
      nationalityCode(key: string): string;
      page(event: { pageIndex: number; pageSize: number }): void;
      sort(event: { active: string; direction: 'asc' | '' }): void;
      retrySearch(): void;
      openPlayer(row: PlayerSearchRow): Promise<void>;
      clearFilters(): void;
    };

    suggestFilters.mockResolvedValue([suggestion]);
    getPlayer.mockResolvedValue({
      ...row,
      firstName: 'Test',
      lastName: 'Player',
      commonName: '',
      jerseyName: 'Player',
      birthDate: null,
      snapshotDate: '2022-08-01',
      height: null,
      weight: null,
      preferredFoot: '1',
      attackingWorkRate: '1',
      defensiveWorkRate: '1',
      attributes: {},
      ratings: {},
      raw: {},
    });
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(null as never);

    testable.setVersions([23]);
    testable.setPositions(['ST']);
    testable.setRange('potential', 'max', { target: { value: '' } } as unknown as Event);
    await testable.suggest('team', { target: { value: 'Ars' } } as unknown as Event);
    testable.addExactFilter('teams', suggestion, input);
    testable.addExactFilter('leagues', { ...suggestion, key: 'premier' }, input);
    testable.addExactFilter('nationalities', { ...suggestion, key: 'england' }, input);
    testable.removeExactFilter('teams', suggestion.key);
    testable.removeExactFilter('nationalities', 'england');
    expect(testable.filterLabel('teams', 'missing')).toBe('missing');
    expect(testable.nationalityCode('missing')).toBe('');
    testable.page({ pageIndex: 2, pageSize: 25 });
    testable.sort({ active: 'name', direction: '' });
    testable.sort({ active: 'name', direction: 'asc' });
    testable.retrySearch();
    await testable.openPlayer(row);
    expect(open).toHaveBeenCalledOnce();

    searchPlayers.mockRejectedValueOnce(new Error('Player unavailable'));
    testable.retrySearch();
    await fixture.whenStable();
    expect(testable.error()).toBe('Player unavailable');
    searchPlayers.mockRejectedValueOnce('failure');
    testable.retrySearch();
    await fixture.whenStable();
    expect(testable.error()).toBe('The database could not be searched.');

    testable.clearFilters();
    await fixture.whenStable();
    expect(testable.request()).toMatchObject({ positions: [], teams: [], leagues: [] });
  });
});

describe('PlayerFinder contextual routing', () => {
  it('applies an exact version and team ID from validated query parameters', async () => {
    window.localStorage.setItem(
      finderFilterPreferenceKey('players'),
      JSON.stringify({
        version: 1,
        filters: { databaseIds: ['custom'], versions: [22], positions: ['ST'] },
      }),
    );
    const searchPlayers = vi.fn(async () => ({
      rows: [],
      total: 0,
      offset: 0,
      pageSize: 50,
    }));
    const getTeam = vi.fn(async () => ({
      key: '23:1',
      databaseId: 'built-in',
      databaseName: 'Built-in FIFA 11–23',
      version: 23,
      teamId: 1,
      name: 'Arsenal',
      leagueId: 13,
      leagueKey: 'england premier league (1)',
      leagueName: 'England Premier League (1)',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      squadSize: 33,
      overall: 80,
      attack: 83,
      midfield: 80,
      defence: 79,
      foundationYear: 1886,
      players: [],
      raw: {},
    }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'players', component: PlayerFinder }]),
        {
          provide: Qdb,
          useValue: {
            searchPlayers,
            suggestFilters: vi.fn(async () => []),
            getPlayer: vi.fn(),
            getTeam,
            getLeague: vi.fn(),
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/players?version=23&teamId=1', PlayerFinder);
    const testable = component as unknown as {
      retrySearch(): void;
      openFilters(): void;
      setDatabases(databaseIds: string[]): void;
      applyFilters(): void;
    };
    testable.retrySearch();
    await harness.fixture.whenStable();

    expect(getTeam).toHaveBeenCalledWith({ databaseId: 'built-in', version: 23, teamId: 1 });
    expect(searchPlayers).toHaveBeenCalledWith(
      expect.objectContaining({
        databaseIds: ['built-in'],
        versions: [23],
        positions: [],
        teamEdition: { databaseId: 'built-in', version: 23, teamId: 1 },
      }),
    );
    expect(harness.routeNativeElement?.textContent).toContain('Arsenal');

    testable.openFilters();
    await harness.fixture.whenStable();
    testable.setDatabases([]);
    expect(harness.routeNativeElement?.textContent).toContain('Arsenal');
    testable.applyFilters();
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement?.querySelector('.context-banner')).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/players');
    TestBed.inject(MatDialog).closeAll();
  });
});
