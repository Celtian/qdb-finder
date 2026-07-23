import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Qdb } from '../../core/qdb';
import {
  defaultFinderColumnPreference,
  type FinderColumnKey,
  type FinderColumnPreference,
} from '../../core/finder-columns';
import {
  finderColumnPreferenceKey,
  finderFilterPreferenceKey,
} from '../../core/finder-preferences';
import type {
  EntityFacetOption,
  TeamDetails,
  TeamEditionRow,
  TeamResultPage,
  TeamSearchRequest,
} from '../../core/qdb-contracts';
import { TeamFinder } from './team-finder';

describe('TeamFinder', () => {
  let component: TeamFinder;
  let fixture: ComponentFixture<TeamFinder>;
  const searchTeams = vi.fn(async (request: TeamSearchRequest) => ({
    rows: [],
    total: 0,
    offset: request.offset,
    pageSize: request.pageSize,
  }));
  const suggestEntityFacets = vi.fn(async (): Promise<EntityFacetOption[]> => []);
  const getTeam = vi.fn(async (): Promise<TeamDetails> => ({}) as TeamDetails);

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TeamFinder],
      providers: [
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            searchTeams,
            suggestEntityFacets,
            getTeam,
            getLeague: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    searchTeams.mockClear();
    suggestEntityFacets.mockClear();
    getTeam.mockClear();
    fixture = TestBed.createComponent(TeamFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
    await vi.waitFor(() => expect(searchTeams).toHaveBeenCalledOnce());
    await fixture.whenStable();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('creates with newest-edition sorting', () => {
    const testable = component as unknown as { request(): TeamSearchRequest };

    expect(component).toBeTruthy();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-navigation-trigger'),
    ).toBeTruthy();
    expect(testable.request()).toMatchObject({ sort: 'version', direction: 'desc' });
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.entity-search')?.textContent,
    ).toContain('Search teams or Original ID');
  });

  it('persists visible columns and resets a hidden active sort without clearing filters', async () => {
    const testable = component as unknown as {
      columns(): readonly FinderColumnKey[];
      request: {
        (): TeamSearchRequest;
        update(update: (value: TeamSearchRequest) => TeamSearchRequest): void;
      };
      applyColumns(preference: FinderColumnPreference): void;
    };
    testable.request.update((value) => ({ ...value, countryIds: [14], offset: 50 }));
    searchTeams.mockClear();

    testable.applyColumns({
      ...defaultFinderColumnPreference('teams'),
      visible: ['name', 'country'],
    });
    await fixture.whenStable();

    expect(testable.columns()).toEqual(['name', 'country']);
    expect(testable.request()).toMatchObject({
      countryIds: [14],
      sort: 'name',
      direction: 'asc',
      offset: 0,
    });
    expect(searchTeams).toHaveBeenCalledWith(
      expect.objectContaining({ countryIds: [14], sort: 'name', direction: 'asc', offset: 0 }),
    );
    expect(
      JSON.parse(window.localStorage.getItem(finderColumnPreferenceKey('teams')) ?? ''),
    ).toEqual({
      ...defaultFinderColumnPreference('teams'),
      visible: ['name', 'country'],
    });
  });

  it('stages rating ranges and searches once on Apply', async () => {
    const testable = component as unknown as { openFilters(): void; applyFilters(): void };
    testable.openFilters();
    await fixture.whenStable();
    const overallMin = document.body.querySelector<HTMLInputElement>(
      '.finder-filter-drawer-panel fieldset input',
    );
    searchTeams.mockClear();

    overallMin!.value = '80';
    overallMin!.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(searchTeams).not.toHaveBeenCalled();
    testable.applyFilters();
    expect(searchTeams).toHaveBeenCalledWith(expect.objectContaining({ overall: { min: 80 } }));
    expect(searchTeams.mock.calls.filter(([request]) => request.overall.min === 80)).toHaveLength(
      1,
    );
    expect(
      JSON.parse(window.localStorage.getItem(finderFilterPreferenceKey('teams')) ?? '').filters
        .overall,
    ).toEqual({ min: 80 });
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.filter-button')
        ?.getAttribute('aria-label'),
    ).toBe('Choose filters, 1 active');
  });

  it('renders the original team ID as a non-sortable column after the name', async () => {
    const row: TeamEditionRow = {
      key: 'internal-team-key',
      databaseId: 'built-in',
      databaseName: 'Built-in FIFA 11–23',
      version: 23,
      teamId: 116_009,
      name: 'Test Team',
      leagueId: 13,
      leagueKey: 'test-league',
      leagueName: 'Test League',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      squadSize: 25,
      overall: 80,
      attack: 81,
      midfield: 79,
      defence: 78,
      domesticPrestige: 7,
      internationalPrestige: 8,
      budget: 75_000_000,
      foundationYear: 1900,
    };
    const testable = component as unknown as {
      columns: { set(value: readonly FinderColumnKey[]): void };
      loading: { set(value: boolean): void };
      error: { set(value: string): void };
      result: { set(value: TeamResultPage): void };
    };

    testable.loading.set(false);
    testable.error.set('');
    testable.result.set({ rows: [row], total: 1, offset: 0, pageSize: 50 });
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const headers = [...element.querySelectorAll<HTMLElement>('th.mat-mdc-header-cell')].map(
      (header) => header.textContent?.trim(),
    );
    const originalIdHeader = element.querySelector<HTMLElement>('th.cdk-column-originalId');
    const originalIdCell = element.querySelector<HTMLElement>('td.cdk-column-originalId');
    expect(headers.slice(0, 4)).toEqual(['Team', 'Original ID', 'Edition', 'Country']);
    expect(originalIdHeader?.querySelector('.mat-sort-header-container')).toBeNull();
    expect(originalIdCell?.textContent?.trim()).toBe('116009');
    expect(originalIdCell?.classList.contains('original-id')).toBe(true);
    expect(element.querySelector('td.cdk-column-database')).toBeNull();
    expect(getComputedStyle(originalIdHeader!).whiteSpace).toBe('nowrap');
    expect(element.querySelector('.column-button')?.getAttribute('aria-label')).toBe(
      'Choose columns, 4 hidden',
    );

    testable.columns.set(['name', 'originalId', 'database']);
    await fixture.whenStable();
    const databaseCell = element.querySelector<HTMLElement>('td.cdk-column-database');
    expect(databaseCell?.textContent?.trim()).toBe('Built-in FIFA 11–23');
    expect(getComputedStyle(databaseCell!).whiteSpace).toBe('nowrap');

    testable.columns.set(['name', 'domesticPrestige', 'internationalPrestige', 'budget']);
    await fixture.whenStable();
    expect(element.querySelector('td.cdk-column-domesticPrestige')?.textContent?.trim()).toBe('7');
    expect(element.querySelector('td.cdk-column-internationalPrestige')?.textContent?.trim()).toBe(
      '8',
    );
    expect(element.querySelector('td.cdk-column-budget')?.textContent?.trim()).toBe(
      (75_000_000).toLocaleString(),
    );
    expect(element.querySelector('th.cdk-column-budget .mat-sort-header-container')).toBeTruthy();
  });

  it('supports the complete interactive filter, paging, sorting and detail workflow', async () => {
    const input = document.createElement('input');
    const option = { key: 'premier', label: 'Premier League', count: 1 };
    const country = {
      key: '14',
      id: 14,
      label: 'England',
      count: 1,
      countryCode: 'gb-eng',
    };
    const row = {
      key: '23:11',
      databaseId: 'built-in',
      databaseName: 'Built-in FIFA 11–23',
      version: 23,
      teamId: 11,
      name: 'Manchester United',
      leagueId: 13,
      leagueKey: 'premier',
      leagueName: 'Premier League',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      squadSize: 25,
      overall: 80,
      attack: 81,
      midfield: 79,
      defence: 78,
      domesticPrestige: 7,
      internationalPrestige: 8,
      budget: null,
      foundationYear: 1878,
    } satisfies TeamEditionRow;
    const testable = component as unknown as {
      request(): TeamSearchRequest;
      rows(): { overallClass: string }[];
      setVersions(versions: number[]): void;
      setRange(kind: 'overall', boundary: 'min' | 'max', event: Event): void;
      suggest(facet: 'league' | 'country', event: Event): Promise<void>;
      addFacet(
        facet: 'league' | 'country',
        option: EntityFacetOption,
        input: HTMLInputElement,
      ): void;
      removeFacet(facet: 'league' | 'country', key: string): void;
      page(event: { pageIndex: number; pageSize: number }): void;
      sort(event: { active: string; direction: 'asc' | '' }): void;
      retrySearch(): void;
      openTeam(row: TeamEditionRow): Promise<void>;
      clearFilters(): void;
      result: { set(value: TeamResultPage): void };
      error(): string;
    };

    suggestEntityFacets.mockResolvedValue([country]);
    getTeam.mockResolvedValue({ ...row, players: [], stadium: null, raw: {} });
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(null as never);

    testable.setVersions([23]);
    testable.setRange('overall', 'min', { target: { value: '70' } } as unknown as Event);
    testable.setRange('overall', 'max', { target: { value: '' } } as unknown as Event);
    await testable.suggest('country', { target: { value: 'Eng' } } as unknown as Event);
    testable.addFacet('league', option, input);
    testable.addFacet('country', country, input);
    testable.addFacet('country', option, input);
    testable.removeFacet('league', option.key);
    testable.removeFacet('country', String(country.id));
    testable.page({ pageIndex: 2, pageSize: 25 });
    testable.sort({ active: 'name', direction: '' });
    testable.sort({ active: 'name', direction: 'asc' });
    testable.retrySearch();
    await testable.openTeam(row);

    testable.result.set({ rows: [{ ...row, overall: null }], total: 1, offset: 0, pageSize: 50 });
    expect(testable.rows()[0]?.overallClass).toBe('');
    expect(open).toHaveBeenCalledOnce();

    searchTeams.mockRejectedValueOnce(new Error('Team unavailable'));
    testable.retrySearch();
    await fixture.whenStable();
    expect(testable.error()).toBe('Team unavailable');

    searchTeams.mockRejectedValueOnce('failure');
    testable.retrySearch();
    await fixture.whenStable();
    expect(testable.error()).toBe('Team search failed.');

    testable.clearFilters();
    await fixture.whenStable();
    expect(testable.request()).toMatchObject({ offset: 0, leagueKeys: [], countryIds: [] });
  });
});

describe('TeamFinder contextual routing', () => {
  it('applies and identifies an exact stadium edition', async () => {
    const searchTeams = vi.fn(async () => ({ rows: [], total: 0, offset: 0, pageSize: 50 }));
    const getStadium = vi.fn(async () => ({ version: 23, stadiumId: 1, name: 'Old Trafford' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'teams', component: TeamFinder }]),
        {
          provide: Qdb,
          useValue: {
            searchTeams,
            getTeam: vi.fn(),
            getLeague: vi.fn(),
            getStadium,
            suggestEntityFacets: vi.fn(async () => []),
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/teams?version=23&stadiumId=1', TeamFinder);
    (component as unknown as { retrySearch(): void }).retrySearch();
    await harness.fixture.whenStable();

    expect(getStadium).toHaveBeenCalledWith({
      databaseId: 'built-in',
      version: 23,
      stadiumId: 1,
    });
    expect(searchTeams).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: [23],
        stadiumEdition: { databaseId: 'built-in', version: 23, stadiumId: 1 },
      }),
    );
    expect(harness.routeNativeElement?.textContent).toContain('Old Trafford');
  });

  it('applies, identifies and clears an exact player edition', async () => {
    const searchTeams = vi.fn(async () => ({ rows: [], total: 0, offset: 0, pageSize: 50 }));
    const getPlayer = vi.fn(async () => ({
      version: 23,
      playerId: 158_023,
      name: 'Lionel Messi',
    }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'teams', component: TeamFinder }]),
        {
          provide: Qdb,
          useValue: {
            searchTeams,
            getPlayer,
            getTeam: vi.fn(),
            getLeague: vi.fn(),
            getStadium: vi.fn(),
            suggestEntityFacets: vi.fn(async () => []),
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/teams?version=23&playerId=158023', TeamFinder);
    const testable = component as unknown as {
      request(): TeamSearchRequest;
      retrySearch(): void;
      clearFilters(): void;
    };
    testable.retrySearch();
    await harness.fixture.whenStable();

    expect(getPlayer).toHaveBeenCalledWith({
      databaseId: 'built-in',
      version: 23,
      playerId: 158_023,
    });
    expect(searchTeams).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: [23],
        playerEdition: { databaseId: 'built-in', version: 23, playerId: 158_023 },
      }),
    );
    expect(harness.routeNativeElement?.textContent).toContain(
      'Showing FIFA 23 teams for Lionel Messi',
    );

    testable.clearFilters();
    await harness.fixture.whenStable();

    expect(testable.request().playerEdition).toBeUndefined();
    expect(TestBed.inject(Router).url).toBe('/teams');
    expect(harness.routeNativeElement?.textContent).not.toContain('Lionel Messi');
  });

  it.each([
    ['incomplete', '/teams?playerId=158023'],
    ['ambiguous', '/teams?version=23&playerId=158023&leagueId=13'],
  ])('rejects %s player context parameters', async (_kind, url) => {
    const searchTeams = vi.fn(async () => ({ rows: [], total: 0, offset: 0, pageSize: 50 }));
    const getPlayer = vi.fn();
    const getLeague = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'teams', component: TeamFinder }]),
        {
          provide: Qdb,
          useValue: {
            searchTeams,
            getPlayer,
            getTeam: vi.fn(),
            getLeague,
            getStadium: vi.fn(),
            suggestEntityFacets: vi.fn(async () => []),
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl(url, TeamFinder);
    const request = (component as unknown as { request(): TeamSearchRequest }).request();
    await harness.fixture.whenStable();

    expect(request.versions).toEqual([]);
    expect(request.playerEdition).toBeUndefined();
    expect(request.leagueEdition).toBeUndefined();
    expect(getPlayer).not.toHaveBeenCalled();
    expect(getLeague).not.toHaveBeenCalled();
  });
});
