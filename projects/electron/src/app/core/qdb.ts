import { inject, Service } from '@angular/core';
import { DatabaseContext } from './database-context';
import type {
  DatabaseDescriptor,
  DatabaseImportProgress,
  DatabaseImportRequest,
  DatabaseImportResult,
  DatabaseSourceSelection,
  DatabaseSourceValidationProgress,
  DatabaseSourceValidationRequest,
  DatabaseSourceValidationResult,
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
  private readonly context = inject(DatabaseContext);

  constructor() {
    void this.refreshDatabaseCatalog();
  }

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
  async listDatabases(): Promise<DatabaseDescriptor[]> {
    const databases = await this.api.listDatabases();
    this.context.set(databases);
    return databases;
  }
  selectDatabaseSource(): Promise<DatabaseSourceSelection | undefined> {
    return this.api.selectDatabaseSource();
  }
  validateDatabaseSource(
    request: DatabaseSourceValidationRequest,
  ): Promise<DatabaseSourceValidationResult> {
    return this.api.validateDatabaseSource(request);
  }
  cancelDatabaseSourceValidation(requestId: string): Promise<boolean> {
    return this.api.cancelDatabaseSourceValidation(requestId);
  }
  async importDatabase(request: DatabaseImportRequest): Promise<DatabaseImportResult> {
    const result = await this.api.importDatabase(request);
    if (result.status === 'completed') await this.refreshDatabaseCatalog(true);
    return result;
  }
  cancelDatabaseImport(requestId: string): Promise<boolean> {
    return this.api.cancelDatabaseImport(requestId);
  }
  async removeDatabase(id: string): Promise<void> {
    await this.api.removeDatabase(id);
    await this.refreshDatabaseCatalog(true);
  }
  async removeCustomDatabases(): Promise<string[]> {
    const removedIds = await this.api.removeCustomDatabases();
    await this.refreshDatabaseCatalog(true);
    return removedIds;
  }
  onDatabaseSourceValidationProgress(
    listener: (progress: DatabaseSourceValidationProgress) => void,
  ): () => void {
    return this.api.onDatabaseSourceValidationProgress(listener);
  }
  onDatabaseImportProgress(listener: (progress: DatabaseImportProgress) => void): () => void {
    return this.api.onDatabaseImportProgress(listener);
  }

  private async refreshDatabaseCatalog(changed = false): Promise<void> {
    try {
      this.context.set(await this.api.listDatabases(), changed);
    } catch {
      // Feature screens already expose database connection errors.
    }
  }
}
