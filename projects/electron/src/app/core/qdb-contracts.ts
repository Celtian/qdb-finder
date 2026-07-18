export type SortField = 'name' | 'version' | 'age' | 'overall' | 'potential' | 'bestRating';

export interface NumberRange {
  min?: number;
  max?: number;
}

export interface SearchRequest {
  text: string;
  versions: number[];
  nationalities: string[];
  teams: string[];
  leagues: string[];
  positions: string[];
  age: NumberRange;
  overall: NumberRange;
  potential: NumberRange;
  pageSize: number;
  offset: number;
  sort: SortField;
  direction: 'asc' | 'desc';
}

export interface PlayerEditionKey {
  version: number;
  playerId: number;
}

export interface PlayerSearchRow extends PlayerEditionKey {
  key: string;
  name: string;
  nationality: string;
  teams: string[];
  leagues: string[];
  positions: string[];
  age: number | null;
  overall: number;
  potential: number;
  bestPosition: string;
  bestRating: number;
}

export interface SearchResultPage {
  rows: PlayerSearchRow[];
  total: number;
  offset: number;
  pageSize: number;
}

export interface PlayerDetails extends PlayerSearchRow {
  firstName: string;
  lastName: string;
  commonName: string;
  jerseyName: string;
  birthDate: string | null;
  snapshotDate: string;
  height: number | null;
  weight: number | null;
  preferredFoot: string;
  attackingWorkRate: string;
  defensiveWorkRate: string;
  attributes: Record<string, number>;
  ratings: Record<string, number>;
  raw: Record<string, string | number>;
}

export type FilterKind = 'nationality' | 'team' | 'league';

export interface FilterSuggestionRequest {
  kind: FilterKind;
  text: string;
  versions: number[];
  limit?: number;
}

export interface FilterSuggestion {
  key: string;
  label: string;
  count: number;
}

export interface DatabaseInfo {
  editions: number;
  teamLinks: number;
  sourceFiles: number;
  versions: number[];
  generatedAt: string;
  sqliteVersion: string;
}

export interface QdbApi {
  searchPlayers(request: SearchRequest): Promise<SearchResultPage>;
  getPlayer(key: PlayerEditionKey): Promise<PlayerDetails>;
  suggestFilters(request: FilterSuggestionRequest): Promise<FilterSuggestion[]>;
  getDatabaseInfo(): Promise<DatabaseInfo>;
}

export const defaultSearchRequest = (): SearchRequest => ({
  text: '',
  versions: [],
  nationalities: [],
  teams: [],
  leagues: [],
  positions: [],
  age: {},
  overall: {},
  potential: {},
  pageSize: 50,
  offset: 0,
  sort: 'bestRating',
  direction: 'desc',
});
