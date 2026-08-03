import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { finderFilterPreferenceKey } from '../../core/finder-preferences';
import { Qdb } from '../../core/qdb';
import { PlayerFinder } from './player-finder';

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
    expect(harness.routeNativeElement?.querySelector('[data-context-banner]')).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/players');
    TestBed.inject(MatDialog).closeAll();
  });
});
