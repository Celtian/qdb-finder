import type {
  EntityFacetOption,
  EntityFacetRequest,
  FilterSuggestion,
  FilterSuggestionRequest,
  LeagueDetails,
  LeagueEditionKey,
  LeagueEditionRow,
  LeagueResultPage,
  LeagueSearchRequest,
  PlayerDetails,
  PlayerEditionKey,
  PlayerSearchRow,
  RefereeDetails,
  RefereeEditionKey,
  RefereeEditionRow,
  RefereeResultPage,
  RefereeSearchRequest,
  SearchRequest,
  SearchResultPage,
  SortDirection,
  StadiumDetails,
  StadiumEditionKey,
  StadiumEditionRow,
  StadiumResultPage,
  StadiumSearchRequest,
  TeamDetails,
  TeamEditionKey,
  TeamEditionRow,
  TeamResultPage,
  TeamSearchRequest,
} from '../src/app/core/qdb-contracts';
import { DatabaseLibrary } from './database-library';
import { PlayerDatabase } from './database';

interface SearchPage<Row> {
  rows: Row[];
  total: number;
  offset: number;
  pageSize: number;
}

interface DatabaseSearchRequest {
  databaseIds: string[];
  pageSize: number;
  offset: number;
  direction: SortDirection;
}

interface SearchSource<Row> {
  database: PlayerDatabase;
  rows: Row[];
  position: number;
  nextOffset: number;
  total: number;
}

const compareText = (left: string, right: string): number => {
  const normalizedLeft = left.toLocaleLowerCase('en');
  const normalizedRight = right.toLocaleLowerCase('en');
  if (normalizedLeft < normalizedRight) return -1;
  if (normalizedLeft > normalizedRight) return 1;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
};

const compareValue = (
  left: string | number | null,
  right: string | number | null,
  direction: SortDirection,
): number => {
  if (left === right) return 0;
  if (left === null) return direction === 'asc' ? -1 : 1;
  if (right === null) return direction === 'asc' ? 1 : -1;
  let compared: number;
  if (typeof left === 'string' && typeof right === 'string') {
    const normalizedLeft = left.toLocaleLowerCase('en');
    const normalizedRight = right.toLocaleLowerCase('en');
    compared = normalizedLeft === normalizedRight ? 0 : normalizedLeft < normalizedRight ? -1 : 1;
  } else compared = left < right ? -1 : 1;
  return direction === 'asc' ? compared : -compared;
};

const compareRows = <Row extends { databaseId: string; key: string; name: string }>(
  left: Row,
  right: Row,
  leftValue: string | number | null,
  rightValue: string | number | null,
  direction: SortDirection,
): number =>
  compareValue(leftValue, rightValue, direction) ||
  compareText(left.name, right.name) ||
  compareText(
    left.key.slice(left.databaseId.length + 1),
    right.key.slice(right.databaseId.length + 1),
  ) ||
  compareText(left.databaseId, right.databaseId);

const playerComparator =
  (request: SearchRequest) =>
  (left: PlayerSearchRow, right: PlayerSearchRow): number => {
    const value = (row: PlayerSearchRow): string | number | null => {
      switch (request.sort) {
        case 'name':
          return row.name;
        case 'version':
          return row.version;
        case 'birthDate':
          return row.birthDate;
        case 'contractValidUntil':
          return row.contractValidUntil;
        case 'age':
          return row.age;
        case 'height':
          return row.height;
        case 'weight':
          return row.weight;
        case 'preferredFoot':
          return row.preferredFoot;
        case 'overall':
          return row.overall;
        case 'potential':
          return row.potential;
        case 'bestRating':
          return row.bestRating;
      }
    };
    return compareRows(left, right, value(left), value(right), request.direction);
  };

const teamComparator =
  (request: TeamSearchRequest) =>
  (left: TeamEditionRow, right: TeamEditionRow): number => {
    const value = (row: TeamEditionRow): string | number | null => {
      switch (request.sort) {
        case 'name':
          return row.name;
        case 'version':
          return row.version;
        case 'league':
          return row.leagueName;
        case 'squadSize':
          return row.squadSize;
        case 'overall':
          return row.overall;
        case 'attack':
          return row.attack;
        case 'midfield':
          return row.midfield;
        case 'defence':
          return row.defence;
        case 'domesticPrestige':
          return row.domesticPrestige;
        case 'internationalPrestige':
          return row.internationalPrestige;
        case 'budget':
          return row.budget;
      }
    };
    return compareRows(left, right, value(left), value(right), request.direction);
  };

const leagueComparator =
  (request: LeagueSearchRequest) =>
  (left: LeagueEditionRow, right: LeagueEditionRow): number => {
    const value = (row: LeagueEditionRow): string | number | null => {
      switch (request.sort) {
        case 'name':
          return row.name;
        case 'version':
          return row.version;
        case 'country':
          return row.countryName;
        case 'level':
          return row.level;
        case 'teamCount':
          return row.teamCount;
        case 'playerCount':
          return row.playerCount;
      }
    };
    return compareRows(left, right, value(left), value(right), request.direction);
  };

const refereeComparator =
  (request: RefereeSearchRequest) =>
  (left: RefereeEditionRow, right: RefereeEditionRow): number => {
    const value = (row: RefereeEditionRow): string | number | null => {
      switch (request.sort) {
        case 'name':
          return row.name;
        case 'version':
          return row.version;
        case 'nationality':
          return row.nationalityName;
        case 'birthDate':
          return row.birthDate;
        case 'age':
          return row.age;
        case 'height':
          return row.height;
        case 'weight':
          return row.weight;
        case 'leagueCount':
          return row.leagueCount;
      }
    };
    return compareRows(left, right, value(left), value(right), request.direction);
  };

const stadiumComparator =
  (request: StadiumSearchRequest) =>
  (left: StadiumEditionRow, right: StadiumEditionRow): number => {
    const value = (row: StadiumEditionRow): string | number | null => {
      switch (request.sort) {
        case 'name':
          return row.name;
        case 'version':
          return row.version;
        case 'country':
          return row.countryName;
        case 'capacity':
          return row.capacity;
        case 'yearBuilt':
          return row.yearBuilt;
        case 'teamCount':
          return row.teamCount;
      }
    };
    return compareRows(left, right, value(left), value(right), request.direction);
  };

export class DatabaseRegistry {
  private readonly databases = new Map<string, PlayerDatabase>();

  constructor(private readonly library: DatabaseLibrary) {
    this.refresh();
  }

  refresh(): void {
    const available = this.library.list().filter((database) => database.status === 'available');
    const availableIds = new Set(available.map((database) => database.id));
    for (const [id, database] of this.databases)
      if (!availableIds.has(id)) {
        database.close();
        this.databases.delete(id);
      }
    for (const descriptor of available)
      if (!this.databases.has(descriptor.id))
        this.databases.set(descriptor.id, new PlayerDatabase(this.library.pathFor(descriptor.id)));
  }

  close(): void {
    for (const database of this.databases.values()) database.close();
    this.databases.clear();
  }

  closeDatabase(id: string): void {
    this.databases.get(id)?.close();
    this.databases.delete(id);
  }

  searchPlayers(request: SearchRequest): SearchResultPage {
    return this.mergeSearch(
      request,
      this.select(
        request.databaseIds,
        request.teamEdition?.databaseId ?? request.leagueEdition?.databaseId,
      ),
      (database, pageRequest) => database.search(pageRequest),
      playerComparator(request),
    );
  }

  getPlayer(key: PlayerEditionKey): PlayerDetails {
    return this.databaseFor(key.databaseId).getPlayer(key);
  }

  searchTeams(request: TeamSearchRequest): TeamResultPage {
    const contextId =
      request.playerEdition?.databaseId ??
      request.leagueEdition?.databaseId ??
      request.stadiumEdition?.databaseId;
    return this.mergeSearch(
      request,
      this.select(request.databaseIds, contextId),
      (database, pageRequest) => database.searchTeams(pageRequest),
      teamComparator(request),
    );
  }

  getTeam(key: TeamEditionKey): TeamDetails {
    return this.databaseFor(key.databaseId).getTeam(key);
  }

  searchLeagues(request: LeagueSearchRequest): LeagueResultPage {
    return this.mergeSearch(
      request,
      this.select(request.databaseIds, request.refereeEdition?.databaseId),
      (database, pageRequest) => database.searchLeagues(pageRequest),
      leagueComparator(request),
    );
  }

  getLeague(key: LeagueEditionKey): LeagueDetails {
    return this.databaseFor(key.databaseId).getLeague(key);
  }

  searchReferees(request: RefereeSearchRequest): RefereeResultPage {
    return this.mergeSearch(
      request,
      this.select(request.databaseIds, request.leagueEdition?.databaseId),
      (database, pageRequest) => database.searchReferees(pageRequest),
      refereeComparator(request),
    );
  }

  getReferee(key: RefereeEditionKey): RefereeDetails {
    return this.databaseFor(key.databaseId).getReferee(key);
  }

  searchStadiums(request: StadiumSearchRequest): StadiumResultPage {
    return this.mergeSearch(
      request,
      this.select(request.databaseIds, request.teamEdition?.databaseId),
      (database, pageRequest) => database.searchStadiums(pageRequest),
      stadiumComparator(request),
    );
  }

  getStadium(key: StadiumEditionKey): StadiumDetails {
    return this.databaseFor(key.databaseId).getStadium(key);
  }

  suggest(request: FilterSuggestionRequest): FilterSuggestion[] {
    const merged = new Map<string, FilterSuggestion>();
    for (const database of this.select(request.databaseIds)) {
      for (const option of database.suggest({ ...request, limit: 50 })) {
        const current = merged.get(option.key);
        if (current) current.count += option.count;
        else merged.set(option.key, { ...option });
      }
    }
    return [...merged.values()]
      .sort((left, right) => right.count - left.count || compareText(left.label, right.label))
      .slice(0, Math.min(request.limit ?? 20, 50));
  }

  suggestEntityFacets(request: EntityFacetRequest): EntityFacetOption[] {
    const merged = new Map<string, EntityFacetOption>();
    for (const database of this.select(request.databaseIds)) {
      for (const option of database.suggestEntityFacets({ ...request, limit: 100 })) {
        const current = merged.get(option.key);
        if (current) current.count += option.count;
        else merged.set(option.key, { ...option });
      }
    }
    return [...merged.values()]
      .sort((left, right) => right.count - left.count || compareText(left.label, right.label))
      .slice(0, Math.min(request.limit ?? 50, 100));
  }

  private databaseFor(id: string): PlayerDatabase {
    const database = this.databases.get(id);
    if (!database) throw new Error('Database was not found or is incompatible.');
    return database;
  }

  private select(ids: string[], contextId?: string): PlayerDatabase[] {
    if (contextId) {
      if (ids.length && !ids.includes(contextId)) return [];
      const database = this.databases.get(contextId);
      return database ? [database] : [];
    }
    if (!ids.length) return [...this.databases.values()];
    return [...new Set(ids)].flatMap((id) => {
      const database = this.databases.get(id);
      return database ? [database] : [];
    });
  }

  private mergeSearch<Request extends DatabaseSearchRequest, Row>(
    request: Request,
    databases: PlayerDatabase[],
    search: (database: PlayerDatabase, request: Request) => SearchPage<Row>,
    compare: (left: Row, right: Row) => number,
  ): SearchPage<Row> {
    const pageSize = Math.min(Math.max(request.pageSize, 1), 200);
    const offset = Math.max(request.offset, 0);
    const chunkSize = 200;
    const sources: SearchSource<Row>[] = databases.map((database) => {
      const page = search(database, { ...request, offset: 0, pageSize: chunkSize });
      return {
        database,
        rows: page.rows,
        position: 0,
        nextOffset: page.rows.length,
        total: page.total,
      };
    });
    const total = sources.reduce((sum, source) => sum + source.total, 0);
    const rows: Row[] = [];
    let consumed = 0;
    const target = Math.min(total, offset + pageSize);

    while (consumed < target) {
      for (const source of sources) {
        if (source.position < source.rows.length || source.nextOffset >= source.total) continue;
        const page = search(source.database, {
          ...request,
          offset: source.nextOffset,
          pageSize: chunkSize,
        });
        source.rows = page.rows;
        source.position = 0;
        source.nextOffset += page.rows.length;
      }
      const candidates = sources.filter((source) => source.position < source.rows.length);
      if (!candidates.length) break;
      let selected = candidates[0]!;
      for (const candidate of candidates.slice(1))
        if (compare(candidate.rows[candidate.position]!, selected.rows[selected.position]!) < 0)
          selected = candidate;
      if (consumed >= offset) rows.push(selected.rows[selected.position]!);
      selected.position += 1;
      consumed += 1;
    }

    return { rows, total, offset, pageSize };
  }
}
