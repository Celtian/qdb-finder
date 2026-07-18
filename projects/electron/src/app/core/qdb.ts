import { Service } from '@angular/core';
import type {
  DatabaseInfo,
  FilterSuggestion,
  FilterSuggestionRequest,
  PlayerDetails,
  PlayerEditionKey,
  SearchRequest,
  SearchResultPage,
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
  suggestFilters(request: FilterSuggestionRequest): Promise<FilterSuggestion[]> {
    return this.api.suggestFilters(request);
  }
  getDatabaseInfo(): Promise<DatabaseInfo> {
    return this.api.getDatabaseInfo();
  }
}
