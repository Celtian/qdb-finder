import { Service } from '@angular/core';
import type {
  DatabaseInfo,
  EntityFacetOption,
  EntityFacetRequest,
  FilterSuggestion,
  FilterSuggestionRequest,
  LeagueDetails,
  LeagueEditionKey,
  LeagueResultPage,
  LeagueSearchRequest,
  PlayerDetails,
  PlayerEditionKey,
  RefereeDetails,
  RefereeEditionKey,
  RefereeResultPage,
  RefereeSearchRequest,
  SearchRequest,
  SearchResultPage,
  StadiumDetails,
  StadiumEditionKey,
  StadiumResultPage,
  StadiumSearchRequest,
  TeamDetails,
  TeamEditionKey,
  TeamResultPage,
  TeamSearchRequest,
} from './qdb-contracts';

@Service()
export class Qdb {
  private get api() {
    if (!globalThis.window?.qdb)
      throw new Error('The QDB desktop bridge is unavailable. Start the Electron application.');
    return globalThis.window.qdb;
  }

  searchPlayers(request: SearchRequest): Promise<SearchResultPage> {
    return this.api.searchPlayers(request);
  }
  getPlayer(key: PlayerEditionKey): Promise<PlayerDetails> {
    return this.api.getPlayer(key);
  }
  searchTeams(request: TeamSearchRequest): Promise<TeamResultPage> {
    return this.api.searchTeams(request);
  }
  getTeam(key: TeamEditionKey): Promise<TeamDetails> {
    return this.api.getTeam(key);
  }
  searchLeagues(request: LeagueSearchRequest): Promise<LeagueResultPage> {
    return this.api.searchLeagues(request);
  }
  getLeague(key: LeagueEditionKey): Promise<LeagueDetails> {
    return this.api.getLeague(key);
  }
  searchReferees(request: RefereeSearchRequest): Promise<RefereeResultPage> {
    return this.api.searchReferees(request);
  }
  getReferee(key: RefereeEditionKey): Promise<RefereeDetails> {
    return this.api.getReferee(key);
  }
  searchStadiums(request: StadiumSearchRequest): Promise<StadiumResultPage> {
    return this.api.searchStadiums(request);
  }
  getStadium(key: StadiumEditionKey): Promise<StadiumDetails> {
    return this.api.getStadium(key);
  }
  suggestEntityFacets(request: EntityFacetRequest): Promise<EntityFacetOption[]> {
    return this.api.suggestEntityFacets(request);
  }
  suggestFilters(request: FilterSuggestionRequest): Promise<FilterSuggestion[]> {
    return this.api.suggestFilters(request);
  }
  getDatabaseInfo(): Promise<DatabaseInfo> {
    return this.api.getDatabaseInfo();
  }
}
