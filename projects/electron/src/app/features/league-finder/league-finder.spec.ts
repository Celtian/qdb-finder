import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Qdb } from '../../core/qdb';
import type {
  LeagueEditionRow,
  LeagueResultPage,
  LeagueSearchRequest,
} from '../../core/qdb-contracts';
import { LeagueFinder } from './league-finder';

describe('LeagueFinder', () => {
  let component: LeagueFinder;
  let fixture: ComponentFixture<LeagueFinder>;
  const searchLeagues = vi.fn(async () => ({ rows: [], total: 0, offset: 0, pageSize: 50 }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueFinder],
      providers: [
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            searchLeagues,
            suggestEntityFacets: vi.fn(async () => []),
            getLeague: vi.fn(),
            getReferee: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    searchLeagues.mockClear();
    fixture = TestBed.createComponent(LeagueFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates with newest-edition sorting', () => {
    const testable = component as unknown as { request(): LeagueSearchRequest };

    expect(component).toBeTruthy();
    expect(testable.request()).toMatchObject({ sort: 'version', direction: 'desc' });
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
