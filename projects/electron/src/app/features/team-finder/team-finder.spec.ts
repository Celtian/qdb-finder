import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Qdb } from '../../core/qdb';
import type { TeamEditionRow, TeamResultPage, TeamSearchRequest } from '../../core/qdb-contracts';
import { TeamFinder } from './team-finder';

describe('TeamFinder', () => {
  let component: TeamFinder;
  let fixture: ComponentFixture<TeamFinder>;
  const searchTeams = vi.fn(async () => ({ rows: [], total: 0, offset: 0, pageSize: 50 }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamFinder],
      providers: [
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            searchTeams,
            suggestEntityFacets: vi.fn(async () => []),
            getTeam: vi.fn(),
            getLeague: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    searchTeams.mockClear();
    fixture = TestBed.createComponent(TeamFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates with newest-edition sorting', () => {
    const testable = component as unknown as { request(): TeamSearchRequest };

    expect(component).toBeTruthy();
    expect(testable.request()).toMatchObject({ sort: 'version', direction: 'desc' });
  });

  it('searches immediately when a rating range changes', async () => {
    const overallMin = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'fieldset input',
    );
    searchTeams.mockClear();

    overallMin!.value = '80';
    overallMin!.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(searchTeams).toHaveBeenCalledWith(expect.objectContaining({ overall: { min: 80 } }));
  });

  it('renders the original team ID as a non-sortable column after the name', async () => {
    const row: TeamEditionRow = {
      key: 'internal-team-key',
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
      foundationYear: 1900,
    };
    const testable = component as unknown as {
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
    expect(headers.slice(0, 3)).toEqual(['Team', 'Original ID', 'Edition']);
    expect(originalIdHeader?.querySelector('.mat-sort-header-container')).toBeNull();
    expect(originalIdCell?.textContent?.trim()).toBe('116009');
    expect(originalIdCell?.classList.contains('original-id')).toBe(true);
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

    expect(getStadium).toHaveBeenCalledWith({ version: 23, stadiumId: 1 });
    expect(searchTeams).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: [23],
        stadiumEdition: { version: 23, stadiumId: 1 },
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

    expect(getPlayer).toHaveBeenCalledWith({ version: 23, playerId: 158_023 });
    expect(searchTeams).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: [23],
        playerEdition: { version: 23, playerId: 158_023 },
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
