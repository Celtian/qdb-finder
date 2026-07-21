import { TestBed } from '@angular/core/testing';

import { DatabaseContext } from './database-context';
import type { DatabaseDescriptor } from './qdb-contracts';
import { Qdb } from './qdb';

describe('Qdb', () => {
  let service: Qdb;
  const api = {
    searchPlayers: vi.fn(),
    getPlayer: vi.fn(),
    searchTeams: vi.fn(),
    getTeam: vi.fn(),
    searchLeagues: vi.fn(),
    getLeague: vi.fn(),
    searchReferees: vi.fn(),
    getReferee: vi.fn(),
    searchStadiums: vi.fn(),
    getStadium: vi.fn(),
    suggestEntityFacets: vi.fn(),
    suggestFilters: vi.fn(),
    listDatabases: vi.fn<() => Promise<DatabaseDescriptor[]>>(async () => []),
    selectDatabaseSource: vi.fn(),
    validateDatabaseSource: vi.fn(),
    cancelDatabaseSourceValidation: vi.fn(),
    importDatabase: vi.fn(),
    cancelDatabaseImport: vi.fn(),
    removeDatabase: vi.fn(async () => undefined),
    onDatabaseSourceValidationProgress: vi.fn(),
    onDatabaseImportProgress: vi.fn(),
  };

  beforeEach(() => {
    Object.defineProperty(window, 'qdb', { value: api, configurable: true });
    TestBed.configureTestingModule({});
    service = TestBed.inject(Qdb);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('forwards entity edition operations through the desktop bridge', () => {
    const teamRequest = {
      databaseIds: [],
      text: '',
      versions: [],
      leagueKeys: [],
      countryIds: [],
      overall: {},
      attack: {},
      midfield: {},
      defence: {},
      pageSize: 50,
      offset: 0,
      sort: 'version' as const,
      direction: 'desc' as const,
    };
    const leagueRequest = {
      databaseIds: [],
      text: '',
      versions: [],
      countryIds: [],
      levels: [],
      pageSize: 50,
      offset: 0,
      sort: 'version' as const,
      direction: 'desc' as const,
    };

    void service.searchTeams(teamRequest);
    void service.getTeam({ databaseId: 'built-in', version: 23, teamId: 1 });
    void service.searchLeagues(leagueRequest);
    void service.getLeague({ databaseId: 'built-in', version: 23, leagueId: 13 });
    const refereeRequest = {
      databaseIds: [],
      text: '',
      versions: [],
      nationalityIds: [],
      leagueKeys: [],
      age: {},
      pageSize: 50,
      offset: 0,
      sort: 'version' as const,
      direction: 'desc' as const,
    };
    const stadiumRequest = {
      databaseIds: [],
      text: '',
      versions: [],
      countryIds: [],
      teamKeys: [],
      capacity: {},
      pageSize: 50,
      offset: 0,
      sort: 'version' as const,
      direction: 'desc' as const,
    };
    void service.searchReferees(refereeRequest);
    void service.getReferee({ databaseId: 'built-in', version: 23, refereeId: 188446 });
    void service.searchStadiums(stadiumRequest);
    void service.getStadium({ databaseId: 'built-in', version: 23, stadiumId: 1 });
    void service.suggestEntityFacets({
      databaseIds: [],
      entity: 'team',
      facet: 'country',
      text: '',
      versions: [23],
    });

    expect(api.searchTeams).toHaveBeenCalledWith(teamRequest);
    expect(api.getTeam).toHaveBeenCalledWith({
      databaseId: 'built-in',
      version: 23,
      teamId: 1,
    });
    expect(api.searchLeagues).toHaveBeenCalledWith(leagueRequest);
    expect(api.getLeague).toHaveBeenCalledWith({
      databaseId: 'built-in',
      version: 23,
      leagueId: 13,
    });
    expect(api.searchReferees).toHaveBeenCalledWith(refereeRequest);
    expect(api.getReferee).toHaveBeenCalledWith({
      databaseId: 'built-in',
      version: 23,
      refereeId: 188446,
    });
    expect(api.searchStadiums).toHaveBeenCalledWith(stadiumRequest);
    expect(api.getStadium).toHaveBeenCalledWith({
      databaseId: 'built-in',
      version: 23,
      stadiumId: 1,
    });
    expect(api.suggestEntityFacets).toHaveBeenCalledOnce();
  });

  it('publishes database catalog changes to database-backed screens', async () => {
    const database = {
      id: 'custom-id',
      name: 'Custom FIFA 23',
      kind: 'custom' as const,
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
      status: 'available' as const,
    };
    api.listDatabases.mockResolvedValueOnce([database]);

    await service.removeDatabase('removed-id');

    const context = TestBed.inject(DatabaseContext);
    expect(context.databases()).toEqual([database]);
    expect(context.revision()).toBe(1);
  });
});
