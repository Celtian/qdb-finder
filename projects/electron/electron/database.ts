import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type {
  DatabaseInfo,
  FilterSuggestion,
  FilterSuggestionRequest,
  PlayerDetails,
  PlayerEditionKey,
  PlayerSearchRow,
  SearchRequest,
  SearchResultPage,
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

const parseList = (value: string | null): string[] =>
  value ? value.split('|').filter(Boolean) : [];
const parseObject = <T>(value: string | null): T => JSON.parse(value ?? '{}') as T;

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
