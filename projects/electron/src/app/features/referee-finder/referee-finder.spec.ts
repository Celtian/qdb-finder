import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Qdb } from '../../core/qdb';
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

  it('renders the empty state after loading', async () => {
    expect(component).toBeTruthy();
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

  it('applies availability and age filters immediately', () => {
    const testable = component as unknown as {
      setAvailability(value: 'all' | 'real' | 'generic'): void;
      setAge(boundary: 'min' | 'max', event: Event): void;
    };
    testable.setAvailability('real');
    testable.setAge('min', { target: { value: '30' } } as unknown as Event);

    expect(searchReferees).toHaveBeenCalledWith(
      expect.objectContaining({ isReal: true, age: { min: 30 } }),
    );
  });

  it('filters gender immediately and resets pagination without changing editions', async () => {
    const testable = component as unknown as {
      request: {
        (): RefereeSearchRequest;
        update(update: (value: RefereeSearchRequest) => RefereeSearchRequest): void;
      };
      setGender(value: 'all' | 'men' | 'women'): void;
    };
    testable.request.update((value) => ({ ...value, versions: [15], offset: 50 }));
    searchReferees.mockClear();

    testable.setGender('women');
    await fixture.whenStable();

    expect(searchReferees).toHaveBeenCalledWith(
      expect.objectContaining({ versions: [15], gender: 'women', offset: 0 }),
    );
    const element = fixture.nativeElement as HTMLElement;
    const hint = element.querySelector('mat-hint');
    expect(element.textContent).toContain('Women available from FIFA 16');
    expect(hint?.closest('mat-form-field')?.classList.contains('filter-with-hint')).toBe(true);

    testable.setGender('all');
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
    expect(headers.slice(0, 4)).toEqual(['Referee', 'Database', 'Original ID', 'Edition']);
    expect(originalIdHeader?.querySelector('.mat-sort-header-container')).toBeNull();
    expect(originalIdCell?.textContent?.trim()).toBe('270317');
    expect(originalIdCell?.classList.contains('original-id')).toBe(true);
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
