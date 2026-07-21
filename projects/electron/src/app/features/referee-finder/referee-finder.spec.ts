import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Qdb } from '../../core/qdb';
import type { FinderColumnKey } from '../../core/finder-columns';
import {
  finderColumnPreferenceKey,
  finderFilterPreferenceKey,
} from '../../core/finder-preferences';
import type {
  EntityFacetOption,
  RefereeDetails,
  RefereeEditionRow,
  RefereeResultPage,
  RefereeSearchRequest,
} from '../../core/qdb-contracts';
import { RefereeFinder } from './referee-finder';

describe('RefereeFinder', () => {
  let component: RefereeFinder;
  let fixture: ComponentFixture<RefereeFinder>;
  const searchReferees = vi.fn(async (request: RefereeSearchRequest) => ({
    rows: [],
    total: 0,
    offset: request.offset,
    pageSize: request.pageSize,
  }));
  const suggestEntityFacets = vi.fn(async (): Promise<EntityFacetOption[]> => []);
  const getReferee = vi.fn(async (): Promise<RefereeDetails> => ({}) as RefereeDetails);

  beforeEach(async () => {
    window.localStorage.clear();
    searchReferees.mockClear();
    await TestBed.configureTestingModule({
      imports: [RefereeFinder],
      providers: [
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            searchReferees,
            getLeague: vi.fn(),
            getReferee,
            suggestEntityFacets,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RefereeFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
    suggestEntityFacets.mockClear();
    getReferee.mockClear();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('renders the empty state after loading', async () => {
    expect(component).toBeTruthy();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-navigation-trigger'),
    ).toBeTruthy();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.entity-search')?.textContent,
    ).toContain('Search referees or Original ID');
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        'No referees match these filters',
      );
    });
  });

  it('stages availability and age filters until Apply', async () => {
    const testable = component as unknown as {
      openFilters(): void;
      setAvailability(value: 'all' | 'real' | 'generic'): void;
      setAge(boundary: 'min' | 'max', event: Event): void;
      applyFilters(): void;
    };
    searchReferees.mockClear();
    testable.openFilters();
    testable.setAvailability('real');
    testable.setAge('min', { target: { value: '30' } } as unknown as Event);

    expect(searchReferees).not.toHaveBeenCalled();
    testable.applyFilters();
    await fixture.whenStable();
    expect(searchReferees).toHaveBeenCalledWith(
      expect.objectContaining({ isReal: true, age: { min: 30 } }),
    );
    expect(
      JSON.parse(window.localStorage.getItem(finderFilterPreferenceKey('referees')) ?? '').filters,
    ).toMatchObject({ isReal: true, age: { min: 30 } });
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.filter-button')
        ?.getAttribute('aria-label'),
    ).toBe('Choose filters, 2 active');
  });

  it('persists visible columns and resets a hidden active sort without clearing filters', async () => {
    const testable = component as unknown as {
      columns(): readonly FinderColumnKey[];
      request: {
        (): RefereeSearchRequest;
        update(update: (value: RefereeSearchRequest) => RefereeSearchRequest): void;
      };
      applyColumns(columns: readonly FinderColumnKey[]): void;
    };
    testable.request.update((value) => ({ ...value, nationalityIds: [14], offset: 50 }));
    searchReferees.mockClear();

    testable.applyColumns(['name', 'birthDate']);
    await fixture.whenStable();

    expect(testable.columns()).toEqual(['name', 'birthDate']);
    expect(testable.request()).toMatchObject({
      nationalityIds: [14],
      sort: 'name',
      direction: 'asc',
      offset: 0,
    });
    expect(searchReferees).toHaveBeenCalledWith(
      expect.objectContaining({
        nationalityIds: [14],
        sort: 'name',
        direction: 'asc',
        offset: 0,
      }),
    );
    expect(
      JSON.parse(window.localStorage.getItem(finderColumnPreferenceKey('referees')) ?? ''),
    ).toEqual(['name', 'birthDate']);
  });

  it('stages gender and resets pagination on Apply without changing editions', async () => {
    const testable = component as unknown as {
      request: {
        (): RefereeSearchRequest;
        update(update: (value: RefereeSearchRequest) => RefereeSearchRequest): void;
      };
      openFilters(): void;
      setGender(value: 'all' | 'men' | 'women'): void;
      applyFilters(): void;
    };
    testable.request.update((value) => ({ ...value, versions: [15], offset: 50 }));
    searchReferees.mockClear();

    testable.openFilters();
    await fixture.whenStable();
    testable.setGender('women');
    expect(searchReferees).not.toHaveBeenCalled();
    const hint = document.body.querySelector('mat-hint');
    expect(document.body.textContent).toContain('Women available from FIFA 16');
    expect(hint?.closest('mat-form-field')?.classList.contains('filter-with-hint')).toBe(true);
    testable.applyFilters();
    await fixture.whenStable();

    expect(searchReferees).toHaveBeenCalledWith(
      expect.objectContaining({ versions: [15], gender: 'women', offset: 0 }),
    );
    testable.openFilters();
    await fixture.whenStable();
    testable.setGender('all');
    testable.applyFilters();
    await fixture.whenStable();

    expect(testable.request().gender).toBeUndefined();
  });

  it('renders the original referee ID as a non-sortable column after the name', async () => {
    const row: RefereeEditionRow = {
      key: 'internal-referee-key',
      databaseId: 'built-in',
      databaseName: 'Built-in FIFA 11–23',
      version: 23,
      refereeId: 270_317,
      name: 'Test Referee',
      firstName: 'Test',
      lastName: 'Referee',
      nationalityId: 14,
      nationalityName: 'England',
      nationalityCode: 'gb-eng',
      birthDate: '1980-01-01',
      age: 43,
      height: 183,
      weight: 78,
      foulStrictness: 1,
      cardStrictness: 2,
      isReal: true,
      leagues: ['Test League'],
      leagueCount: 1,
    };
    const testable = component as unknown as {
      loading: { set(value: boolean): void };
      error: { set(value: string): void };
      result: { set(value: RefereeResultPage): void };
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
    expect(headers.slice(0, 4)).toEqual(['Referee', 'Original ID', 'Edition', 'Nationality']);
    expect(originalIdHeader?.querySelector('.mat-sort-header-container')).toBeNull();
    expect(originalIdCell?.textContent?.trim()).toBe('270317');
    expect(originalIdCell?.classList.contains('original-id')).toBe(true);
    const birthDateCell = element.querySelector<HTMLElement>('td.cdk-column-birthDate');
    expect(birthDateCell?.textContent?.trim()).toBe('1 Jan 1980');
    expect(getComputedStyle(originalIdHeader!).whiteSpace).toBe('nowrap');
    expect(getComputedStyle(birthDateCell!).whiteSpace).toBe('nowrap');
    expect(element.querySelector('td.cdk-column-database')).toBeNull();
    expect(element.querySelector('td.cdk-column-leagues')).toBeNull();
    expect(element.querySelector('td.cdk-column-age')).toBeNull();
    expect(element.querySelector('td.cdk-column-height')?.textContent?.trim()).toBe('183 cm');
    expect(element.querySelector('td.cdk-column-weight')?.textContent?.trim()).toBe('78 kg');
    expect(element.querySelector('.column-button')?.getAttribute('aria-label')).toBe(
      'Choose columns, 3 hidden',
    );

    testable.result.set({ rows: [{ ...row, birthDate: null }], total: 1, offset: 0, pageSize: 50 });
    await fixture.whenStable();
    expect(element.querySelector('td.cdk-column-birthDate')?.textContent?.trim()).toBe('—');
  });

  it('supports the complete facet, paging, sorting and detail workflow', async () => {
    const input = document.createElement('input');
    const league = { key: 'premier', label: 'Premier League', count: 1 };
    const nationality = {
      key: '14',
      id: 14,
      label: 'England',
      count: 1,
      countryCode: 'gb-eng',
    };
    const row = {
      key: '23:1',
      databaseId: 'built-in',
      databaseName: 'Built-in FIFA 11–23',
      version: 23,
      refereeId: 1,
      name: 'Test Referee',
      firstName: 'Test',
      lastName: 'Referee',
      nationalityId: 14,
      nationalityName: 'England',
      nationalityCode: 'gb-eng',
      birthDate: null,
      age: 40,
      height: 180,
      weight: 75,
      foulStrictness: 1,
      cardStrictness: 1,
      isReal: true,
      leagues: ['Premier League'],
      leagueCount: 1,
    } satisfies RefereeEditionRow;
    const testable = component as unknown as {
      request(): RefereeSearchRequest;
      error(): string;
      rows(): { leagueText: string }[];
      setVersions(versions: number[]): void;
      setGender(gender: 'all' | 'men' | 'women'): void;
      setAge(boundary: 'min' | 'max', event: Event): void;
      setAvailability(value: 'all' | 'real' | 'generic'): void;
      suggest(facet: 'nationality' | 'league', event: Event): Promise<void>;
      addFacet(
        facet: 'nationality' | 'league',
        option: EntityFacetOption,
        input: HTMLInputElement,
      ): void;
      removeFacet(facet: 'nationality' | 'league', key: string): void;
      page(event: { pageIndex: number; pageSize: number }): void;
      sort(event: { active: string; direction: 'asc' | '' }): void;
      retrySearch(): void;
      openReferee(row: RefereeEditionRow): Promise<void>;
      clearFilters(): void;
      result: { set(value: RefereeResultPage): void };
    };

    suggestEntityFacets.mockResolvedValue([nationality]);
    getReferee.mockResolvedValue({ ...row, leaguesPreview: [], raw: {} });
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(null as never);

    testable.setVersions([23]);
    testable.setGender('men');
    testable.setAge('max', { target: { value: '' } } as unknown as Event);
    testable.setAvailability('generic');
    testable.setAvailability('all');
    await testable.suggest('nationality', { target: { value: 'Eng' } } as unknown as Event);
    testable.addFacet('league', league, input);
    testable.addFacet('nationality', nationality, input);
    testable.addFacet('nationality', league, input);
    testable.removeFacet('league', league.key);
    testable.removeFacet('nationality', String(nationality.id));
    testable.page({ pageIndex: 2, pageSize: 25 });
    testable.sort({ active: 'name', direction: '' });
    testable.sort({ active: 'name', direction: 'asc' });
    testable.retrySearch();
    await testable.openReferee(row);
    testable.result.set({ rows: [row], total: 1, offset: 0, pageSize: 50 });
    expect(testable.rows()[0]?.leagueText).toBe('Premier League');
    expect(open).toHaveBeenCalledOnce();

    searchReferees.mockRejectedValueOnce(new Error('Referee unavailable'));
    testable.retrySearch();
    await fixture.whenStable();
    expect(testable.error()).toBe('Referee unavailable');
    searchReferees.mockRejectedValueOnce('failure');
    testable.retrySearch();
    await fixture.whenStable();
    expect(testable.error()).toBe('Referee search failed.');

    testable.clearFilters();
    await fixture.whenStable();
    expect(testable.request()).toMatchObject({ nationalityIds: [], leagueKeys: [] });
  });
});

describe('RefereeFinder contextual routing', () => {
  it('applies and identifies an exact league edition', async () => {
    const searchReferees = vi.fn(async (request: RefereeSearchRequest) => ({
      rows: [],
      total: 0,
      offset: request.offset,
      pageSize: request.pageSize,
    }));
    const getLeague = vi.fn(async () => ({
      version: 23,
      leagueId: 13,
      name: 'England Premier League (1)',
    }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'referees', component: RefereeFinder }]),
        {
          provide: Qdb,
          useValue: {
            searchReferees,
            getLeague,
            getReferee: vi.fn(),
            suggestEntityFacets: vi.fn(async () => []),
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl(
      '/referees?version=23&leagueId=13',
      RefereeFinder,
    );
    (component as unknown as { retrySearch(): void }).retrySearch();
    await harness.fixture.whenStable();

    expect(getLeague).toHaveBeenCalledWith({
      databaseId: 'built-in',
      version: 23,
      leagueId: 13,
    });
    expect(searchReferees).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: [23],
        leagueEdition: { databaseId: 'built-in', version: 23, leagueId: 13 },
      }),
    );
    expect(harness.routeNativeElement?.textContent).toContain('England Premier League (1)');
  });
});
