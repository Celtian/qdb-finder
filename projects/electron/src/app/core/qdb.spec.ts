import { TestBed } from '@angular/core/testing';

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
    suggestEntityFacets: vi.fn(),
    suggestFilters: vi.fn(),
    getDatabaseInfo: vi.fn(),
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
    void service.getTeam({ version: 23, teamId: 1 });
    void service.searchLeagues(leagueRequest);
    void service.getLeague({ version: 23, leagueId: 13 });
    void service.suggestEntityFacets({
      entity: 'team',
      facet: 'country',
      text: '',
      versions: [23],
    });

    expect(api.searchTeams).toHaveBeenCalledWith(teamRequest);
    expect(api.getTeam).toHaveBeenCalledWith({ version: 23, teamId: 1 });
    expect(api.searchLeagues).toHaveBeenCalledWith(leagueRequest);
    expect(api.getLeague).toHaveBeenCalledWith({ version: 23, leagueId: 13 });
    expect(api.suggestEntityFacets).toHaveBeenCalledOnce();
  });
});
