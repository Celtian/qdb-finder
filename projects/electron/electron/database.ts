import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type {
  DatabaseInfo,
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
  SearchRequest,
  SearchResultPage,
  TeamDetails,
  TeamEditionKey,
  TeamEditionRow,
  TeamResultPage,
  TeamSearchRequest,
} from '../src/app/core/qdb-contracts';

type Row = Record<string, string | number | null>;

const sortColumns: Record<SearchRequest['sort'], string> = {
  name: 'p.display_name COLLATE NOCASE',
  version: 'p.version',
  age: 'p.age',
  overall: 'p.overall',
  potential: 'p.potential',
  bestRating: 'p.best_rating',
};
const teamSortColumns: Record<TeamSearchRequest['sort'], string> = {
  name: 't.team_name COLLATE NOCASE',
  version: 't.version',
  league: 't.league_name COLLATE NOCASE',
  squadSize: 't.squad_size',
  overall: 't.overall',
  attack: 't.attack',
  midfield: 't.midfield',
  defence: 't.defence',
};
const leagueSortColumns: Record<LeagueSearchRequest['sort'], string> = {
  name: 'l.league_name COLLATE NOCASE',
  version: 'l.version',
  country: 'l.country_name COLLATE NOCASE',
  level: 'l.level',
  teamCount: 'l.team_count',
  playerCount: 'l.player_count',
};

const parseList = (value: string | null): string[] =>
  value ? value.split('|').filter(Boolean) : [];
const parseObject = <T>(value: string | null): T => JSON.parse(value ?? '{}') as T;
const nullableNumber = (value: string | number | null): number | null =>
  value === null ? null : Number(value);
const normalizeSearchText = (value: string): string =>
  value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('en').trim();
const likeValue = (value: string): string =>
  `%${normalizeSearchText(value).replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;

export class PlayerDatabase {
  private readonly database: DatabaseSync;

  constructor(path: string) {
    this.database = new DatabaseSync(path, { readOnly: true });
    this.database.exec('PRAGMA query_only = ON; PRAGMA foreign_keys = ON;');
  }

  close(): void {
    this.database.close();
  }

  search(request: SearchRequest): SearchResultPage {
    const where: string[] = [];
    const values: SQLInputValue[] = [];
    const join = this.addTextSearch(request.text, where, values);
    this.addListFilter('p.version', request.versions, where, values);
    this.addListFilter('p.nationality_key', request.nationalities, where, values);
    this.addExistsFilter('team_key', request.teams, where, values);
    this.addExistsFilter('league_key', request.leagues, where, values);
    this.addExactEditionFilter('team_id', request.teamEdition, where, values);
    this.addExactEditionFilter('league_id', request.leagueEdition, where, values);
    this.addDelimitedFilter('p.positions', request.positions, where, values);
    this.addRange('p.age', request.age, where, values);
    this.addRange('p.overall', request.overall, where, values);
    this.addRange('p.potential', request.potential, where, values);

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const totalRow = this.database
      .prepare(`SELECT count(DISTINCT p.key) AS total FROM player_edition p ${join} ${clause}`)
      .get(...values) as Row;
    const direction = request.direction === 'asc' ? 'ASC' : 'DESC';
    const pageSize = Math.min(Math.max(request.pageSize, 1), 200);
    const offset = Math.max(request.offset, 0);
    const rows = this.database
      .prepare(
        `
        SELECT p.*, group_concat(DISTINCT pt.team_name) AS team_names,
          group_concat(DISTINCT pt.league_name) AS league_names
        FROM player_edition p ${join}
        LEFT JOIN player_team pt ON pt.player_key = p.key
        ${clause}
        GROUP BY p.key
        ORDER BY ${sortColumns[request.sort]} ${direction}, p.display_name ASC, p.key ASC
        LIMIT ? OFFSET ?`,
      )
      .all(...values, pageSize, offset) as Row[];

    return {
      rows: rows.map((row) => this.toSearchRow(row)),
      total: Number(totalRow['total']),
      offset,
      pageSize,
    };
  }

  searchTeams(request: TeamSearchRequest): TeamResultPage {
    const where: string[] = [];
    const values: SQLInputValue[] = [];
    if (request.text.trim()) {
      where.push("t.team_key LIKE ? ESCAPE '\\'");
      values.push(likeValue(request.text));
    }
    this.addListFilter('t.version', request.versions, where, values);
    this.addListFilter('t.league_key', request.leagueKeys, where, values);
    this.addListFilter('t.country_id', request.countryIds, where, values);
    this.addRange('t.overall', request.overall, where, values);
    this.addRange('t.attack', request.attack, where, values);
    this.addRange('t.midfield', request.midfield, where, values);
    this.addRange('t.defence', request.defence, where, values);
    if (request.leagueEdition) {
      where.push('t.version = ? AND t.league_id = ?');
      values.push(request.leagueEdition.version, request.leagueEdition.leagueId);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = Number(
      (
        this.database
          .prepare(`SELECT count(*) AS total FROM team_edition t ${clause}`)
          .get(...values) as Row
      )['total'],
    );
    const pageSize = Math.min(Math.max(request.pageSize, 1), 200);
    const offset = Math.max(request.offset, 0);
    const direction = request.direction === 'asc' ? 'ASC' : 'DESC';
    const rows = this.database
      .prepare(
        `SELECT * FROM team_edition t ${clause}
         ORDER BY ${teamSortColumns[request.sort]} ${direction}, t.team_name ASC, t.key ASC
         LIMIT ? OFFSET ?`,
      )
      .all(...values, pageSize, offset) as Row[];
    return { rows: rows.map((row) => this.toTeamRow(row)), total, offset, pageSize };
  }

  getTeam(key: TeamEditionKey): TeamDetails {
    const row = this.database
      .prepare('SELECT * FROM team_edition WHERE version = ? AND team_id = ?')
      .get(key.version, key.teamId) as Row | undefined;
    if (!row) throw new Error('Team edition was not found.');
    const players = this.database
      .prepare(
        `SELECT p.*, group_concat(DISTINCT all_pt.team_name) AS team_names,
          group_concat(DISTINCT all_pt.league_name) AS league_names
         FROM player_edition p
         LEFT JOIN player_team all_pt ON all_pt.player_key = p.key
         WHERE EXISTS (
           SELECT 1 FROM player_team selected
           WHERE selected.player_key = p.key AND selected.version = ? AND selected.team_id = ?
         )
         GROUP BY p.key
         ORDER BY p.overall DESC, p.best_rating DESC, p.display_name ASC
         LIMIT 10`,
      )
      .all(key.version, key.teamId) as Row[];
    return {
      ...this.toTeamRow(row),
      players: players.map((player) => this.toSearchRow(player)),
      raw: parseObject<Record<string, string | number>>(String(row['raw_json'])),
    };
  }

  searchLeagues(request: LeagueSearchRequest): LeagueResultPage {
    const where: string[] = [];
    const values: SQLInputValue[] = [];
    if (request.text.trim()) {
      where.push("l.league_key LIKE ? ESCAPE '\\'");
      values.push(likeValue(request.text));
    }
    this.addListFilter('l.version', request.versions, where, values);
    this.addListFilter('l.country_id', request.countryIds, where, values);
    this.addListFilter('l.level', request.levels, where, values);
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = Number(
      (
        this.database
          .prepare(`SELECT count(*) AS total FROM league_edition l ${clause}`)
          .get(...values) as Row
      )['total'],
    );
    const pageSize = Math.min(Math.max(request.pageSize, 1), 200);
    const offset = Math.max(request.offset, 0);
    const direction = request.direction === 'asc' ? 'ASC' : 'DESC';
    const rows = this.database
      .prepare(
        `SELECT * FROM league_edition l ${clause}
         ORDER BY ${leagueSortColumns[request.sort]} ${direction}, l.league_name ASC, l.key ASC
         LIMIT ? OFFSET ?`,
      )
      .all(...values, pageSize, offset) as Row[];
    return { rows: rows.map((row) => this.toLeagueRow(row)), total, offset, pageSize };
  }

  getLeague(key: LeagueEditionKey): LeagueDetails {
    const row = this.database
      .prepare('SELECT * FROM league_edition WHERE version = ? AND league_id = ?')
      .get(key.version, key.leagueId) as Row | undefined;
    if (!row) throw new Error('League edition was not found.');
    const teams = this.database
      .prepare(
        `SELECT * FROM team_edition
         WHERE version = ? AND league_id = ?
         ORDER BY overall IS NULL, overall DESC, team_name ASC LIMIT 10`,
      )
      .all(key.version, key.leagueId) as Row[];
    return {
      ...this.toLeagueRow(row),
      teams: teams.map((team) => this.toTeamRow(team)),
      raw: parseObject<Record<string, string | number>>(String(row['raw_json'])),
    };
  }

  suggestEntityFacets(request: EntityFacetRequest): EntityFacetOption[] {
    if (request.entity === 'league' && request.facet === 'league') return [];
    const table = request.entity === 'team' ? 'team_edition' : 'league_edition';
    const alias = request.entity === 'team' ? 't' : 'l';
    const isCountry = request.facet === 'country';
    const key = isCountry ? 'country_id' : 'league_key';
    const label = isCountry ? 'country_name' : 'league_name';
    const code = isCountry ? `max(${alias}.country_code)` : "''";
    const values: SQLInputValue[] = [];
    const where = [
      `${alias}.${key} IS NOT NULL`,
      `${alias}.${key} <> ''`,
      `${alias}.${label} <> ''`,
    ];
    if (request.text.trim()) {
      where.push(`${alias}.${label} LIKE ? ESCAPE '\\'`);
      values.push(
        `%${request.text.trim().replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`,
      );
    }
    if (request.versions.length) {
      where.push(`${alias}.version IN (${request.versions.map(() => '?').join(',')})`);
      values.push(...request.versions);
    }
    const rows = this.database
      .prepare(
        `SELECT ${alias}.${key} AS key, max(${alias}.${label}) AS label,
          count(*) AS count, ${code} AS country_code
         FROM ${table} ${alias} WHERE ${where.join(' AND ')}
         GROUP BY ${alias}.${key} ORDER BY count DESC, label ASC LIMIT ?`,
      )
      .all(...values, Math.min(request.limit ?? 50, 100)) as Row[];
    return rows.map((facet) => ({
      key: String(facet['key']),
      label: String(facet['label']),
      count: Number(facet['count']),
      id: isCountry ? Number(facet['key']) : undefined,
      countryCode: String(facet['country_code'] ?? ''),
    }));
  }

  getPlayer(key: PlayerEditionKey): PlayerDetails {
    const row = this.database
      .prepare(
        `
        SELECT p.*, group_concat(DISTINCT pt.team_name) AS team_names,
          group_concat(DISTINCT pt.league_name) AS league_names
        FROM player_edition p
        LEFT JOIN player_team pt ON pt.player_key = p.key
        WHERE p.version = ? AND p.player_id = ? GROUP BY p.key`,
      )
      .get(key.version, key.playerId) as Row | undefined;
    if (!row) throw new Error('Player edition was not found.');
    return {
      ...this.toSearchRow(row),
      firstName: String(row['first_name'] ?? ''),
      lastName: String(row['last_name'] ?? ''),
      commonName: String(row['common_name'] ?? ''),
      jerseyName: String(row['jersey_name'] ?? ''),
      birthDate: row['birth_date'] === null ? null : String(row['birth_date']),
      snapshotDate: String(row['snapshot_date']),
      height: row['height'] === null ? null : Number(row['height']),
      weight: row['weight'] === null ? null : Number(row['weight']),
      preferredFoot: String(row['preferred_foot'] ?? ''),
      attackingWorkRate: String(row['attacking_work_rate'] ?? ''),
      defensiveWorkRate: String(row['defensive_work_rate'] ?? ''),
      attributes: parseObject<Record<string, number>>(String(row['attributes_json'])),
      ratings: parseObject<Record<string, number>>(String(row['ratings_json'])),
      raw: parseObject<Record<string, string | number>>(String(row['raw_json'])),
    };
  }

  suggest(request: FilterSuggestionRequest): FilterSuggestion[] {
    const source = {
      nationality: {
        table: 'player_edition',
        key: 'nationality_key',
        label: 'nationality_name',
        code: 'nationality_code',
      },
      team: { table: 'player_team', key: 'team_key', label: 'team_name', code: undefined },
      league: { table: 'player_team', key: 'league_key', label: 'league_name', code: undefined },
    }[request.kind];
    const { table, key, label, code } = source;
    const values: SQLInputValue[] = [];
    const where = [`${key} <> ''`];
    if (request.text.trim()) {
      where.push(`${label} LIKE ? ESCAPE '\\'`);
      values.push(
        `%${request.text.trim().replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`,
      );
    }
    if (request.versions.length) {
      where.push(`version IN (${request.versions.map(() => '?').join(',')})`);
      values.push(...request.versions);
    }
    const rows = this.database
      .prepare(
        `SELECT ${key} AS key, max(${label}) AS label, count(*) AS count,
          ${code ? `max(${code})` : "''"} AS nationality_code
        FROM ${table} WHERE ${where.join(' AND ')} GROUP BY ${key}
        ORDER BY count DESC, label ASC LIMIT ?`,
      )
      .all(...values, Math.min(request.limit ?? 20, 50)) as Row[];
    return rows.map((row) => ({
      key: String(row['key']),
      label: String(row['label']),
      count: Number(row['count']),
      nationalityCode: String(row['nationality_code'] ?? ''),
    }));
  }

  info(): DatabaseInfo {
    const metadata = Object.fromEntries(
      (this.database.prepare('SELECT key, value FROM metadata').all() as Row[]).map((row) => [
        row['key'],
        row['value'],
      ]),
    );
    return {
      editions: Number(metadata['player_editions'] ?? 0),
      teamEditions: Number(metadata['team_editions'] ?? 0),
      leagueEditions: Number(metadata['league_editions'] ?? 0),
      teamLinks: Number(metadata['team_player_links'] ?? 0),
      sourceFiles: Number(metadata['source_files'] ?? 0),
      versions: String(metadata['versions'] ?? '')
        .split(',')
        .filter(Boolean)
        .map(Number),
      generatedAt: String(metadata['generated_at'] ?? ''),
      sqliteVersion: String(
        this.database.prepare('SELECT sqlite_version() AS value').get()?.['value'] ?? '',
      ),
    };
  }

  private toSearchRow(row: Row): PlayerSearchRow {
    return {
      key: String(row['key']),
      version: Number(row['version']),
      playerId: Number(row['player_id']),
      name: String(row['display_name']),
      nationality: String(row['nationality_name'] ?? ''),
      nationalityCode: String(row['nationality_code'] ?? ''),
      teams: parseList(
        row['team_names'] === null ? null : String(row['team_names']).replaceAll(',', '|'),
      ),
      leagues: parseList(
        row['league_names'] === null ? null : String(row['league_names']).replaceAll(',', '|'),
      ),
      positions: parseList(String(row['positions'] ?? '')),
      age: row['age'] === null ? null : Number(row['age']),
      overall: Number(row['overall']),
      potential: Number(row['potential']),
      bestPosition: String(row['best_position']),
      bestRating: Number(row['best_rating']),
    };
  }

  private toTeamRow(row: Row): TeamEditionRow {
    return {
      key: String(row['key']),
      version: Number(row['version']),
      teamId: Number(row['team_id']),
      name: String(row['team_name']),
      leagueId: nullableNumber(row['league_id']),
      leagueKey: String(row['league_key'] ?? ''),
      leagueName: String(row['league_name'] ?? ''),
      countryId: nullableNumber(row['country_id']),
      countryName: String(row['country_name'] ?? ''),
      countryCode: String(row['country_code'] ?? ''),
      squadSize: Number(row['squad_size']),
      overall: nullableNumber(row['overall']),
      attack: nullableNumber(row['attack']),
      midfield: nullableNumber(row['midfield']),
      defence: nullableNumber(row['defence']),
      foundationYear: nullableNumber(row['foundation_year']),
    };
  }

  private toLeagueRow(row: Row): LeagueEditionRow {
    return {
      key: String(row['key']),
      version: Number(row['version']),
      leagueId: Number(row['league_id']),
      name: String(row['league_name']),
      countryId: nullableNumber(row['country_id']),
      countryName: String(row['country_name'] ?? ''),
      countryCode: String(row['country_code'] ?? ''),
      level: nullableNumber(row['level']),
      isWomen: row['is_women'] === null ? null : Boolean(row['is_women']),
      teamCount: Number(row['team_count']),
      playerCount: Number(row['player_count']),
    };
  }

  private addTextSearch(text: string, where: string[], values: SQLInputValue[]): string {
    const tokens =
      text
        .normalize('NFKD')
        .replace(/\p{M}/gu, '')
        .toLocaleLowerCase('en')
        .match(/[\p{L}\p{N}]+/gu) ?? [];
    if (!tokens.length) return '';
    where.push('player_search MATCH ?');
    values.push(tokens.map((token) => `"${token.replaceAll('"', '""')}"*`).join(' AND '));
    return 'JOIN player_search ON player_search.player_key = p.key';
  }

  private addListFilter(
    column: string,
    input: readonly (string | number)[],
    where: string[],
    values: SQLInputValue[],
  ): void {
    if (!input.length) return;
    where.push(`${column} IN (${input.map(() => '?').join(',')})`);
    values.push(...input);
  }

  private addExistsFilter(
    column: 'team_key' | 'league_key',
    input: string[],
    where: string[],
    values: SQLInputValue[],
  ): void {
    if (!input.length) return;
    where.push(
      `EXISTS (SELECT 1 FROM player_team f WHERE f.player_key = p.key AND f.${column} IN (${input.map(() => '?').join(',')}))`,
    );
    values.push(...input);
  }

  private addExactEditionFilter(
    column: 'team_id' | 'league_id',
    key: TeamEditionKey | LeagueEditionKey | undefined,
    where: string[],
    values: SQLInputValue[],
  ): void {
    if (!key) return;
    const id = 'teamId' in key ? key.teamId : key.leagueId;
    where.push(
      `EXISTS (SELECT 1 FROM player_team exact WHERE exact.player_key = p.key AND exact.version = ? AND exact.${column} = ?)`,
    );
    values.push(key.version, id);
  }

  private addDelimitedFilter(
    column: string,
    input: string[],
    where: string[],
    values: SQLInputValue[],
  ): void {
    if (!input.length) return;
    where.push(`(${input.map(() => `('|' || ${column} || '|') LIKE ?`).join(' OR ')})`);
    values.push(...input.map((value) => `%|${value}|%`));
  }

  private addRange(
    column: string,
    range: { min?: number; max?: number },
    where: string[],
    values: SQLInputValue[],
  ): void {
    if (range.min !== undefined) {
      where.push(`${column} >= ?`);
      values.push(range.min);
    }
    if (range.max !== undefined) {
      where.push(`${column} <= ?`);
      values.push(range.max);
    }
  }
}
