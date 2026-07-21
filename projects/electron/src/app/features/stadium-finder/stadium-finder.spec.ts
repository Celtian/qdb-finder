import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Qdb } from '../../core/qdb';
import type { FinderColumnKey } from '../../core/finder-columns';
import { finderColumnPreferenceKey } from '../../core/finder-column-preferences';
import type {
  EntityFacetOption,
  StadiumDetails,
  StadiumEditionRow,
  StadiumResultPage,
  StadiumSearchRequest,
} from '../../core/qdb-contracts';
import { StadiumFinder } from './stadium-finder';

describe('StadiumFinder', () => {
  let component: StadiumFinder;
  let fixture: ComponentFixture<StadiumFinder>;
  const searchStadiums = vi.fn(async (request: StadiumSearchRequest) => ({
    rows: [],
    total: 0,
    offset: request.offset,
    pageSize: request.pageSize,
  }));
  const suggestEntityFacets = vi.fn(async (): Promise<EntityFacetOption[]> => []);
  const getStadium = vi.fn(async (): Promise<StadiumDetails> => ({}) as StadiumDetails);

  beforeEach(async () => {
    window.localStorage.clear();
    searchStadiums.mockClear();
    await TestBed.configureTestingModule({
      imports: [StadiumFinder],
      providers: [
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            searchStadiums,
            getTeam: vi.fn(),
            getStadium,
            suggestEntityFacets,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StadiumFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
    suggestEntityFacets.mockClear();
    getStadium.mockClear();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('renders the empty state after loading', async () => {
    expect(component).toBeTruthy();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[aria-label="Open main navigation"]'),
    ).toBeTruthy();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.entity-search')?.textContent,
    ).toContain('Search stadiums or Original ID');
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        'No stadiums match these filters',
      );
    });
  });

  it('stages licensed and capacity filters until Apply', async () => {
    const testable = component as unknown as {
      openFilters(): void;
      setAvailability(value: 'all' | 'licensed' | 'generic'): void;
      setCapacity(boundary: 'min' | 'max', event: Event): void;
      applyFilters(): void;
    };
    searchStadiums.mockClear();
    testable.openFilters();
    testable.setAvailability('licensed');
    testable.setCapacity('min', { target: { value: '50000' } } as unknown as Event);

    expect(searchStadiums).not.toHaveBeenCalled();
    testable.applyFilters();
    await fixture.whenStable();
    expect(searchStadiums).toHaveBeenLastCalledWith(
      expect.objectContaining({ isLicensed: true, capacity: { min: 50_000 } }),
    );
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
        (): StadiumSearchRequest;
        update(update: (value: StadiumSearchRequest) => StadiumSearchRequest): void;
      };
      applyColumns(columns: readonly FinderColumnKey[]): void;
    };
    testable.request.update((value) => ({ ...value, countryIds: [14], offset: 50 }));
    searchStadiums.mockClear();

    testable.applyColumns(['name', 'capacity']);
    await fixture.whenStable();

    expect(testable.columns()).toEqual(['name', 'capacity']);
    expect(testable.request()).toMatchObject({
      countryIds: [14],
      sort: 'name',
      direction: 'asc',
      offset: 0,
    });
    expect(searchStadiums).toHaveBeenCalledWith(
      expect.objectContaining({ countryIds: [14], sort: 'name', direction: 'asc', offset: 0 }),
    );
    expect(
      JSON.parse(window.localStorage.getItem(finderColumnPreferenceKey('stadiums')) ?? ''),
    ).toEqual(['name', 'capacity']);
  });

  it('renders the original stadium ID as a non-sortable column after the name', async () => {
    const row: StadiumEditionRow = {
      key: 'internal-stadium-key',
      databaseId: 'built-in',
      databaseName: 'Built-in FIFA 11–23',
      version: 23,
      stadiumId: 1098,
      name: 'Test Stadium',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      capacity: 50_000,
      yearBuilt: 2000,
      pitchLengthMeters: 105,
      pitchWidthMeters: 68,
      isLicensed: true,
      isSmallSided: false,
      teamCount: 1,
    };
    const testable = component as unknown as {
      loading: { set(value: boolean): void };
      error: { set(value: string): void };
      result: { set(value: StadiumResultPage): void };
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
    expect(headers.slice(0, 4)).toEqual(['Stadium', 'Original ID', 'Database', 'Edition']);
    expect(originalIdHeader?.querySelector('.mat-sort-header-container')).toBeNull();
    expect(originalIdCell?.textContent?.trim()).toBe('1098');
    expect(originalIdCell?.classList.contains('original-id')).toBe(true);
    expect(element.querySelector('.column-button')?.getAttribute('aria-label')).toBe(
      'Choose columns, 0 hidden',
    );
  });

  it('supports the complete facet, paging, sorting and detail workflow', async () => {
    const input = document.createElement('input');
    const team = { key: 'united', label: 'Manchester United', count: 1 };
    const country = {
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
      stadiumId: 1,
      name: 'Old Trafford',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      capacity: 75_000,
      yearBuilt: 1910,
      pitchLengthMeters: 105,
      pitchWidthMeters: 68,
      isLicensed: true,
      isSmallSided: false,
      teamCount: 1,
    } satisfies StadiumEditionRow;
    const testable = component as unknown as {
      request(): StadiumSearchRequest;
      error(): string;
      rows(): { pitch: string; licensed: string }[];
      setVersions(versions: number[]): void;
      setCapacity(boundary: 'min' | 'max', event: Event): void;
      setAvailability(value: 'all' | 'licensed' | 'generic'): void;
      suggest(facet: 'country' | 'team', event: Event): Promise<void>;
      addFacet(facet: 'country' | 'team', option: EntityFacetOption, input: HTMLInputElement): void;
      removeFacet(facet: 'country' | 'team', key: string): void;
      page(event: { pageIndex: number; pageSize: number }): void;
      sort(event: { active: string; direction: 'asc' | '' }): void;
      retrySearch(): void;
      openStadium(row: StadiumEditionRow): Promise<void>;
      clearFilters(): void;
      result: { set(value: StadiumResultPage): void };
    };

    suggestEntityFacets.mockResolvedValue([country]);
    getStadium.mockResolvedValue({ ...row, teams: [], raw: {} });
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(null as never);

    testable.setVersions([23]);
    testable.setCapacity('max', { target: { value: '' } } as unknown as Event);
    testable.setAvailability('generic');
    testable.setAvailability('all');
    await testable.suggest('country', { target: { value: 'Eng' } } as unknown as Event);
    testable.addFacet('team', team, input);
    testable.addFacet('country', country, input);
    testable.addFacet('country', team, input);
    testable.removeFacet('team', team.key);
    testable.removeFacet('country', String(country.id));
    testable.page({ pageIndex: 2, pageSize: 25 });
    testable.sort({ active: 'name', direction: '' });
    testable.sort({ active: 'name', direction: 'asc' });
    testable.retrySearch();
    await testable.openStadium(row);
    testable.result.set({
      rows: [{ ...row, pitchLengthMeters: null, isLicensed: null }],
      total: 1,
      offset: 0,
      pageSize: 50,
    });
    expect(testable.rows()[0]).toMatchObject({ pitch: '—', licensed: '—' });
    testable.result.set({
      rows: [{ ...row, isLicensed: false }],
      total: 1,
      offset: 0,
      pageSize: 50,
    });
    expect(testable.rows()[0]).toMatchObject({ pitch: '105 × 68 m', licensed: 'No' });
    expect(open).toHaveBeenCalledOnce();

    searchStadiums.mockRejectedValueOnce(new Error('Stadium unavailable'));
    testable.retrySearch();
    await fixture.whenStable();
    expect(testable.error()).toBe('Stadium unavailable');
    searchStadiums.mockRejectedValueOnce('failure');
    testable.retrySearch();
    await fixture.whenStable();
    expect(testable.error()).toBe('Stadium search failed.');

    testable.clearFilters();
    await fixture.whenStable();
    expect(testable.request()).toMatchObject({ countryIds: [], teamKeys: [] });
  });
});

describe('StadiumFinder contextual routing', () => {
  it('applies and identifies an exact team edition', async () => {
    const searchStadiums = vi.fn(async (request: StadiumSearchRequest) => ({
      rows: [],
      total: 0,
      offset: request.offset,
      pageSize: request.pageSize,
    }));
    const getTeam = vi.fn(async () => ({ version: 23, teamId: 11, name: 'Manchester United' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'stadiums', component: StadiumFinder }]),
        {
          provide: Qdb,
          useValue: {
            searchStadiums,
            getTeam,
            getStadium: vi.fn(),
            suggestEntityFacets: vi.fn(async () => []),
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/stadiums?version=23&teamId=11', StadiumFinder);
    (component as unknown as { retrySearch(): void }).retrySearch();
    await harness.fixture.whenStable();

    expect(getTeam).toHaveBeenCalledWith({
      databaseId: 'built-in',
      version: 23,
      teamId: 11,
    });
    expect(searchStadiums).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: [23],
        teamEdition: { databaseId: 'built-in', version: 23, teamId: 11 },
      }),
    );
    expect(harness.routeNativeElement?.textContent).toContain('Manchester United');
  });
});
