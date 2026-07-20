import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Qdb } from '../../core/qdb';
import type {
  EntityFacetOption,
  LeagueDetails,
  LeagueEditionRow,
  LeagueResultPage,
  LeagueSearchRequest,
} from '../../core/qdb-contracts';
import { LeagueFinder } from './league-finder';

describe('LeagueFinder', () => {
  let component: LeagueFinder;
  let fixture: ComponentFixture<LeagueFinder>;
  const searchLeagues = vi.fn(async () => ({ rows: [], total: 0, offset: 0, pageSize: 50 }));
  const suggestEntityFacets = vi.fn(async (): Promise<EntityFacetOption[]> => []);
  const getLeague = vi.fn(async (): Promise<LeagueDetails> => ({}) as LeagueDetails);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueFinder],
      providers: [
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            searchLeagues,
            suggestEntityFacets,
            getLeague,
            getReferee: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    searchLeagues.mockClear();
    suggestEntityFacets.mockClear();
    getLeague.mockClear();
    fixture = TestBed.createComponent(LeagueFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates with newest-edition sorting', () => {
    const testable = component as unknown as { request(): LeagueSearchRequest };

    expect(component).toBeTruthy();
    expect(testable.request()).toMatchObject({ sort: 'version', direction: 'desc' });
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.entity-search')?.textContent,
    ).toContain('Search leagues or Original ID');
  });

  it('searches immediately when league tiers change', async () => {
    const testable = component as unknown as { setLevels(levels: number[]): void };
    searchLeagues.mockClear();

    testable.setLevels([1, 2]);
    await fixture.whenStable();

    expect(searchLeagues).toHaveBeenCalledWith(expect.objectContaining({ levels: [1, 2] }));
  });

  it('renders the original league ID as a non-sortable column after the name', async () => {
    const row: LeagueEditionRow = {
      key: 'internal-league-key',
      version: 23,
      leagueId: 2216,
      name: 'Test League',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      level: 1,
      isWomen: false,
      teamCount: 20,
      playerCount: 500,
    };
    const testable = component as unknown as {
      loading: { set(value: boolean): void };
      error: { set(value: string): void };
      result: { set(value: LeagueResultPage): void };
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
    expect(headers.slice(0, 3)).toEqual(['League', 'Original ID', 'Edition']);
    expect(originalIdHeader?.querySelector('.mat-sort-header-container')).toBeNull();
    expect(originalIdCell?.textContent?.trim()).toBe('2216');
    expect(originalIdCell?.classList.contains('original-id')).toBe(true);
  });

  it('supports the complete country, paging, sorting and detail workflow', async () => {
    const input = document.createElement('input');
    const country = {
      key: '14',
      id: 14,
      label: 'England',
      count: 1,
      countryCode: 'gb-eng',
    };
    const missingId = { key: 'england', label: 'England', count: 1 };
    const row = {
      key: '23:13',
      version: 23,
      leagueId: 13,
      name: 'Premier League',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      level: 1,
      isWomen: false,
      teamCount: 20,
      playerCount: 636,
    } satisfies LeagueEditionRow;
    const testable = component as unknown as {
      request(): LeagueSearchRequest;
      error(): string;
      setVersions(versions: number[]): void;
      setLevels(levels: number[]): void;
      suggestCountries(event: Event): Promise<void>;
      addCountry(option: EntityFacetOption, input: HTMLInputElement): void;
      removeCountry(key: string): void;
      page(event: { pageIndex: number; pageSize: number }): void;
      sort(event: { active: string; direction: 'asc' | '' }): void;
      retrySearch(): void;
      openLeague(row: LeagueEditionRow): Promise<void>;
      clearFilters(): void;
    };

    suggestEntityFacets.mockResolvedValue([country]);
    getLeague.mockResolvedValue({ ...row, teams: [], referees: [], refereeCount: 0, raw: {} });
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open').mockReturnValue(null as never);

    testable.setVersions([23]);
    testable.setLevels([1]);
    await testable.suggestCountries({ target: { value: 'Eng' } } as unknown as Event);
    testable.addCountry(missingId, input);
    testable.addCountry(country, input);
    testable.removeCountry(String(country.id));
    testable.page({ pageIndex: 2, pageSize: 25 });
    testable.sort({ active: 'name', direction: '' });
    testable.sort({ active: 'name', direction: 'asc' });
    testable.retrySearch();
    await testable.openLeague(row);
    expect(open).toHaveBeenCalledOnce();

    searchLeagues.mockRejectedValueOnce(new Error('League unavailable'));
    testable.retrySearch();
    await fixture.whenStable();
    expect(testable.error()).toBe('League unavailable');

    searchLeagues.mockRejectedValueOnce('failure');
    testable.retrySearch();
    await fixture.whenStable();
    expect(testable.error()).toBe('League search failed.');

    testable.clearFilters();
    await fixture.whenStable();
    expect(testable.request()).toMatchObject({ offset: 0, levels: [], countryIds: [] });
  });
});

describe('LeagueFinder contextual routing', () => {
  it('applies and identifies an exact referee edition', async () => {
    const searchLeagues = vi.fn(async () => ({ rows: [], total: 0, offset: 0, pageSize: 50 }));
    const getReferee = vi.fn(async () => ({
      version: 23,
      refereeId: 221_871,
      name: 'Test Referee',
    }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'leagues', component: LeagueFinder }]),
        {
          provide: Qdb,
          useValue: {
            searchLeagues,
            getLeague: vi.fn(),
            getReferee,
            suggestEntityFacets: vi.fn(async () => []),
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl(
      '/leagues?version=23&refereeId=221871',
      LeagueFinder,
    );
    (component as unknown as { retrySearch(): void }).retrySearch();
    await harness.fixture.whenStable();

    expect(getReferee).toHaveBeenCalledWith({ version: 23, refereeId: 221_871 });
    expect(searchLeagues).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: [23],
        refereeEdition: { version: 23, refereeId: 221_871 },
      }),
    );
    expect(harness.routeNativeElement?.textContent).toContain('Test Referee');
  });
});
