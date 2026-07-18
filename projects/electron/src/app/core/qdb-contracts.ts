export type SortField = 'name' | 'version' | 'age' | 'overall' | 'potential' | 'bestRating';
export type SortDirection = 'asc' | 'desc';
export type TeamSortField =
  | 'name'
  | 'version'
  | 'league'
  | 'squadSize'
  | 'overall'
  | 'attack'
  | 'midfield'
  | 'defence';
export type LeagueSortField =
  | 'name'
  | 'version'
  | 'country'
  | 'level'
  | 'teamCount'
  | 'playerCount';

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
  direction: SortDirection;
  teamEdition?: TeamEditionKey;
  leagueEdition?: LeagueEditionKey;
}

export interface PlayerEditionKey {
  version: number;
  playerId: number;
}

export interface TeamEditionKey {
  version: number;
  teamId: number;
}

export interface LeagueEditionKey {
  version: number;
  leagueId: number;
}

export interface PlayerSearchRow extends PlayerEditionKey {
  key: string;
  name: string;
  nationality: string;
  nationalityCode: string;
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

export interface TeamSearchRequest {
  text: string;
  versions: number[];
  leagueKeys: string[];
  countryIds: number[];
  overall: NumberRange;
  attack: NumberRange;
  midfield: NumberRange;
  defence: NumberRange;
  pageSize: number;
  offset: number;
  sort: TeamSortField;
  direction: SortDirection;
  leagueEdition?: LeagueEditionKey;
}

export interface TeamEditionRow extends TeamEditionKey {
  key: string;
  name: string;
  leagueId: number | null;
  leagueKey: string;
  leagueName: string;
  countryId: number | null;
  countryName: string;
  countryCode: string;
  squadSize: number;
  overall: number | null;
  attack: number | null;
  midfield: number | null;
  defence: number | null;
  foundationYear: number | null;
}

export interface TeamDetails extends TeamEditionRow {
  players: PlayerSearchRow[];
  raw: Record<string, string | number>;
}

export interface TeamResultPage {
  rows: TeamEditionRow[];
  total: number;
  offset: number;
  pageSize: number;
}

export interface LeagueSearchRequest {
  text: string;
  versions: number[];
  countryIds: number[];
  levels: number[];
  pageSize: number;
  offset: number;
  sort: LeagueSortField;
  direction: SortDirection;
}

export interface LeagueEditionRow extends LeagueEditionKey {
  key: string;
  name: string;
  countryId: number | null;
  countryName: string;
  countryCode: string;
  level: number | null;
  isWomen: boolean | null;
  teamCount: number;
  playerCount: number;
}

export interface LeagueDetails extends LeagueEditionRow {
  teams: TeamEditionRow[];
  raw: Record<string, string | number>;
}

export interface LeagueResultPage {
  rows: LeagueEditionRow[];
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
  nationalityCode?: string;
}

export type EntityFacet = 'league' | 'country';

export interface EntityFacetRequest {
  entity: 'team' | 'league';
  facet: EntityFacet;
  text: string;
  versions: number[];
  limit?: number;
}

export interface EntityFacetOption {
  key: string;
  label: string;
  count: number;
  id?: number;
  countryCode?: string;
}

export interface DatabaseInfo {
  editions: number;
  teamEditions: number;
  leagueEditions: number;
  teamLinks: number;
  sourceFiles: number;
  versions: number[];
  generatedAt: string;
  sqliteVersion: string;
}

export interface QdbApi {
  searchPlayers(request: SearchRequest): Promise<SearchResultPage>;
  getPlayer(key: PlayerEditionKey): Promise<PlayerDetails>;
  searchTeams(request: TeamSearchRequest): Promise<TeamResultPage>;
  getTeam(key: TeamEditionKey): Promise<TeamDetails>;
  searchLeagues(request: LeagueSearchRequest): Promise<LeagueResultPage>;
  getLeague(key: LeagueEditionKey): Promise<LeagueDetails>;
  suggestEntityFacets(request: EntityFacetRequest): Promise<EntityFacetOption[]>;
  suggestFilters(request: FilterSuggestionRequest): Promise<FilterSuggestion[]>;
  getDatabaseInfo(): Promise<DatabaseInfo>;
}

export interface QdbWindowApi {
  readonly nativeControls: boolean;
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  close(): Promise<void>;
  isMaximized(): Promise<boolean>;
  onMaximizedChange(listener: (maximized: boolean) => void): () => void;
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
  sort: 'version',
  direction: 'desc',
});

export const defaultTeamSearchRequest = (): TeamSearchRequest => ({
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
  sort: 'version',
  direction: 'desc',
});

export const defaultLeagueSearchRequest = (): LeagueSearchRequest => ({
  text: '',
  versions: [],
  countryIds: [],
  levels: [],
  pageSize: 50,
  offset: 0,
  sort: 'version',
  direction: 'desc',
});
