import { mkdirSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { Attribute, CalculateUtils, Fifa as RatingFifa, Position } from 'fifarating';
import { registerFifaDatePrototype } from 'fifadate';
import {
  Datatype,
  Fifa,
  Table,
  fifaTableConfig,
  formatRawValue,
  sortByOrder,
  type Field,
} from 'fifatables';

declare global {
  interface DateConstructor {
    fromFifaDate(value: number): Date;
  }
}

registerFifaDatePrototype();

export const FIFAS = Object.values(Fifa);
export const TABLES = Object.values(Table);
export const EXPECTED_EDITIONS = 227_572;
export const EXPECTED_TEAM_LINKS = 241_640;
export const POSITION_IDS = Object.values(Position);
const positionById = Object.fromEntries(POSITION_IDS.map((position, index) => [index, position]));

type RawRow = Record<string, string | number>;
type SqlRow = Record<string, string | number | null>;

export interface ImportOptions {
  examplesPath: string;
  outputPath: string;
  verifyExpectedCounts?: boolean;
}

export interface ImportSummary {
  sourceFiles: number;
  rawRows: number;
  playerEditions: number;
  teamLinks: number;
}

export const decodeFifaText = (buffer: Buffer): string => {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe)
    return buffer.subarray(2).toString('utf16le');
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff)
    throw new Error('UTF-16BE files are not supported.');
  return buffer.toString('utf16le').replace(/^\uFEFF/, '');
};

export const parseTsvLine = (line: string): string[] => {
  const result: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === '\t' && !quoted) {
      result.push(value);
      value = '';
    } else value += character;
  }
  result.push(value);
  return result;
};

export const readTable = (path: string, fields: Field[]): RawRow[] => {
  const lines = decodeFifaText(readFileSync(path)).split(/\r?\n/);
  while (lines.at(-1) === '') lines.pop();
  if (!lines.length) return [];
  const ordered = [...fields].sort(sortByOrder);
  const header = parseTsvLine(lines[0]);
  const expected = ordered.map((field) => field.name);
  if (header.length !== expected.length || header.some((name, index) => name !== expected[index])) {
    throw new Error(
      `Header mismatch in ${path}.\nExpected: ${expected.join('\t')}\nActual: ${header.join('\t')}`,
    );
  }
  return lines.slice(1).map((line, rowIndex) => {
    const values = parseTsvLine(line);
    if (values.length !== ordered.length)
      throw new Error(`Column mismatch in ${path} at data row ${rowIndex + 1}.`);
    return Object.fromEntries(
      ordered.map((field, index) => [field.name, formatRawValue(field, values[index])]),
    );
  });
};

const quote = (value: string): string => `"${value.replaceAll('"', '""')}"`;
const normalize = (value: string): string =>
  value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('en').trim();
const asNumber = (value: string | number | null | undefined, fallback = 0): number =>
  Number(value ?? fallback);
const asText = (value: string | number | null | undefined): string => String(value ?? '').trim();
const isoDate = (value: string | number): string | null => {
  if (!Number(value)) return null;
  const date = Date.fromFifaDate(Number(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};
const ageAt = (birth: string | null, snapshot: string): number | null => {
  if (!birth) return null;
  const born = new Date(`${birth}T00:00:00Z`);
  const at = new Date(`${snapshot}T00:00:00Z`);
  let age = at.getUTCFullYear() - born.getUTCFullYear();
  if (
    at.getUTCMonth() < born.getUTCMonth() ||
    (at.getUTCMonth() === born.getUTCMonth() && at.getUTCDate() < born.getUTCDate())
  )
    age -= 1;
  return age;
};

const createSchema = (db: DatabaseSync): void =>
  db.exec(`
  PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON;
  CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE import_source (version INTEGER NOT NULL, table_name TEXT NOT NULL, source_file TEXT NOT NULL,
    row_count INTEGER NOT NULL, bytes INTEGER NOT NULL, PRIMARY KEY(version, table_name));
  CREATE TABLE import_missing (version INTEGER NOT NULL, table_name TEXT NOT NULL, reason TEXT NOT NULL,
    PRIMARY KEY(version, table_name));
  CREATE TABLE player_edition (
    key TEXT PRIMARY KEY, version INTEGER NOT NULL, player_id INTEGER NOT NULL,
    display_name TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
    common_name TEXT NOT NULL, jersey_name TEXT NOT NULL, aliases TEXT NOT NULL,
    nationality_key TEXT NOT NULL, nationality_name TEXT NOT NULL, birth_date TEXT, snapshot_date TEXT NOT NULL,
    age INTEGER, positions TEXT NOT NULL, overall INTEGER NOT NULL, potential INTEGER NOT NULL,
    best_position TEXT NOT NULL, best_rating INTEGER NOT NULL, height INTEGER, weight INTEGER,
    preferred_foot TEXT NOT NULL, attacking_work_rate TEXT NOT NULL, defensive_work_rate TEXT NOT NULL,
    attributes_json TEXT NOT NULL, ratings_json TEXT NOT NULL, raw_json TEXT NOT NULL,
    UNIQUE(version, player_id)
  );
  CREATE TABLE player_team (
    player_key TEXT NOT NULL REFERENCES player_edition(key) ON DELETE CASCADE, version INTEGER NOT NULL,
    player_id INTEGER NOT NULL, team_id INTEGER NOT NULL, team_key TEXT NOT NULL, team_name TEXT NOT NULL,
    league_id INTEGER, league_key TEXT NOT NULL, league_name TEXT NOT NULL, position TEXT NOT NULL,
    jersey_number INTEGER, PRIMARY KEY(player_key, team_id)
  );
  CREATE VIRTUAL TABLE player_search USING fts5(player_key UNINDEXED, display_name, aliases, teams,
    nationality, leagues, tokenize='unicode61 remove_diacritics 2');
`);

const rawTableName = (fifa: Fifa, table: Table): string => `raw_${fifa}_${table}`;

const importRawTables = (
  db: DatabaseSync,
  examplesPath: string,
): { files: number; rows: number } => {
  let files = 0;
  let rows = 0;
  const source = db.prepare('INSERT INTO import_source VALUES (?, ?, ?, ?, ?)');
  const missing = db.prepare('INSERT INTO import_missing VALUES (?, ?, ?)');
  for (const fifa of FIFAS)
    for (const table of TABLES) {
      const version = Number(fifa.slice(4));
      const fields = [...fifaTableConfig(fifa, table)].sort(sortByOrder);
      const path = join(examplesPath, fifa, `${table}.txt`);
      let fileStat: ReturnType<typeof statSync> | undefined;
      try {
        fileStat = statSync(path);
      } catch {
        // Reported below with the most specific available reason.
      }
      if (!fields.length) {
        const sourceLines = fileStat
          ? decodeFifaText(readFileSync(path)).split(/\r?\n/).filter(Boolean)
          : [];
        if (fileStat && sourceLines.length <= 1) {
          source.run(version, table, path, 0, fileStat.size);
          missing.run(version, table, 'Header-only source has no fifatables definition');
          files += 1;
          continue;
        }
        missing.run(version, table, 'No fifatables definition');
        continue;
      }
      if (!fileStat) {
        missing.run(version, table, 'Source file is missing');
        continue;
      }
      const data = readTable(path, fields);
      const columns = fields.map(
        (field) =>
          `${quote(field.name)} ${field.type === Datatype.String ? 'TEXT' : field.type === Datatype.Float ? 'REAL' : 'INTEGER'}`,
      );
      db.exec(`CREATE TABLE ${quote(rawTableName(fifa, table))} (${columns.join(',')})`);
      const insert = db.prepare(
        `INSERT INTO ${quote(rawTableName(fifa, table))} VALUES (${fields.map(() => '?').join(',')})`,
      );
      db.exec('BEGIN');
      try {
        for (const row of data)
          insert.run(...fields.map((field) => row[field.name] as SQLInputValue));
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      source.run(version, table, path, data.length, fileStat.size);
      files += 1;
      rows += data.length;
    }
  return { files, rows };
};

const tableRows = (db: DatabaseSync, fifa: Fifa, table: Table): SqlRow[] =>
  db.prepare(`SELECT * FROM ${quote(rawTableName(fifa, table))}`).all() as SqlRow[];
const mapBy = (rows: SqlRow[], key: string, value: string): Map<number, string> =>
  new Map(rows.map((row) => [asNumber(row[key]), asText(row[value])]));
const versionSnapshot = (examplesPath: string, fifa: Fifa): string => {
  if (fifa === Fifa.Fifa11) return '2010-10-01';
  const path = join(examplesPath, fifa, 'version.txt');
  const lines = decodeFifaText(readFileSync(path)).split(/\r?\n/);
  const header = parseTsvLine(lines[0]);
  const values = parseTsvLine(lines[1]);
  return isoDate(values[header.indexOf('exportdate')]) ?? `${Number(fifa.slice(4)) - 1}-10-01`;
};

const ratingFor = (
  fifa: Fifa,
  player: SqlRow,
  overall: number,
  preferred: string,
): { bestPosition: string; bestRating: number; ratings: Record<string, number> } => {
  if (fifa === Fifa.Fifa11)
    return { bestPosition: preferred, bestRating: overall, ratings: { [preferred]: overall } };
  const attributes = Object.fromEntries(
    Object.values(Attribute).map((attribute) => [attribute, asNumber(player[attribute], overall)]),
  ) as Record<Attribute, number>;
  const ratingFifa = fifa as unknown as RatingFifa;
  const ratings = Object.fromEntries(
    POSITION_IDS.map((position) => [
      position,
      Math.round(CalculateUtils.rawOverall(attributes, ratingFifa, position)),
    ]),
  );
  const [bestPosition, bestRating] = Object.entries(ratings).sort((a, b) => b[1] - a[1])[0];
  return { bestPosition, bestRating, ratings };
};

const buildCanonical = (
  db: DatabaseSync,
  examplesPath: string,
): { players: number; links: number } => {
  const playerInsert = db.prepare(
    `INSERT INTO player_edition VALUES (${Array.from({ length: 27 }, () => '?').join(',')})`,
  );
  const linkInsert = db.prepare(
    'INSERT OR IGNORE INTO player_team VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  let players = 0;
  let links = 0;
  for (const fifa of FIFAS) {
    const version = Number(fifa.slice(4));
    const snapshot = versionSnapshot(examplesPath, fifa);
    const names = mapBy(tableRows(db, fifa, Table.PlayerNames), 'nameid', 'name');
    const nations = mapBy(tableRows(db, fifa, Table.Nations), 'nationid', 'nationname');
    const teams = mapBy(tableRows(db, fifa, Table.Teams), 'teamid', 'teamname');
    const leagues = mapBy(tableRows(db, fifa, Table.Leagues), 'leagueid', 'leaguename');
    const teamLeagues = new Map<number, number>();
    for (const row of tableRows(db, fifa, Table.LeagueTeamLinks))
      teamLeagues.set(asNumber(row['teamid']), asNumber(row['leagueid']));
    const memberships = new Map<number, SqlRow[]>();
    for (const row of tableRows(db, fifa, Table.TeamPlayerLinks)) {
      const id = asNumber(row['playerid']);
      memberships.set(id, [...(memberships.get(id) ?? []), row]);
    }
    db.exec('BEGIN');
    try {
      for (const player of tableRows(db, fifa, Table.Players)) {
        const playerId = asNumber(player['playerid']);
        const key = `${version}:${playerId}`;
        const first = names.get(asNumber(player['firstnameid'])) ?? '';
        const last = names.get(asNumber(player['lastnameid'])) ?? '';
        const common = names.get(asNumber(player['commonnameid'])) ?? '';
        const jersey = names.get(asNumber(player['playerjerseynameid'])) ?? '';
        const display =
          common || [first, last].filter(Boolean).join(' ') || jersey || `Player ${playerId}`;
        const positionIds = [1, 2, 3, 4].map((index) =>
          asNumber(player[`preferredposition${index}`], -1),
        );
        const positions = [...new Set(positionIds.map((id) => positionById[id]).filter(Boolean))];
        const preferred = positions[0] ?? 'Unknown';
        const overall = asNumber(player['overallrating']);
        const potential = asNumber(player['potential'], overall);
        const nationality = nations.get(asNumber(player['nationality'])) ?? '';
        const birthDate = isoDate(asNumber(player['birthdate']));
        const attributes = Object.fromEntries(
          Object.values(Attribute).map((attribute) => [
            attribute,
            asNumber(player[attribute], overall),
          ]),
        );
        const rating = ratingFor(fifa, player, overall, preferred);
        playerInsert.run(
          key,
          version,
          playerId,
          display,
          first,
          last,
          common,
          jersey,
          [first, last, common, jersey].filter(Boolean).join(' '),
          normalize(nationality),
          nationality,
          birthDate,
          snapshot,
          ageAt(birthDate, snapshot),
          positions.join('|'),
          overall,
          potential,
          rating.bestPosition,
          rating.bestRating,
          player['height'] ?? null,
          player['weight'] ?? null,
          asText(player['preferredfoot']),
          asText(player['attackingworkrate']),
          asText(player['defensiveworkrate']),
          JSON.stringify(attributes),
          JSON.stringify(rating.ratings),
          JSON.stringify(player),
        );
        players += 1;
        for (const membership of memberships.get(playerId) ?? []) {
          const teamId = asNumber(membership['teamid']);
          const teamName = teams.get(teamId) ?? '';
          const leagueId = teamLeagues.get(teamId) ?? null;
          const leagueName = leagueId === null ? '' : (leagues.get(leagueId) ?? '');
          const result = linkInsert.run(
            key,
            version,
            playerId,
            teamId,
            normalize(teamName),
            teamName,
            leagueId,
            normalize(leagueName),
            leagueName,
            positionById[asNumber(membership['position'])] ?? asText(membership['position']),
            membership['jerseynumber'] ?? null,
          );
          links += Number(result.changes);
        }
      }
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  db.exec(`
    INSERT INTO player_search
      SELECT p.key, p.display_name, p.aliases, coalesce(group_concat(DISTINCT pt.team_name), ''),
        p.nationality_name, coalesce(group_concat(DISTINCT pt.league_name), '')
      FROM player_edition p LEFT JOIN player_team pt ON pt.player_key = p.key GROUP BY p.key;
    CREATE INDEX idx_player_version ON player_edition(version);
    CREATE INDEX idx_player_nation ON player_edition(nationality_key);
    CREATE INDEX idx_player_age ON player_edition(age);
    CREATE INDEX idx_player_overall ON player_edition(overall);
    CREATE INDEX idx_player_potential ON player_edition(potential);
    CREATE INDEX idx_player_rating ON player_edition(best_rating);
    CREATE INDEX idx_team_key ON player_team(team_key);
    CREATE INDEX idx_league_key ON player_team(league_key);
    CREATE INDEX idx_team_player ON player_team(player_key);
  `);
  return { players, links };
};

export const buildDatabase = (options: ImportOptions): ImportSummary => {
  mkdirSync(dirname(options.outputPath), { recursive: true });
  try {
    unlinkSync(options.outputPath);
  } catch {
    /* a clean output is optional */
  }
  const db = new DatabaseSync(options.outputPath);
  try {
    createSchema(db);
    const raw = importRawTables(db, options.examplesPath);
    const canonical = buildCanonical(db, options.examplesPath);
    const metadata = db.prepare('INSERT INTO metadata VALUES (?, ?)');
    const values = {
      generated_at: new Date().toISOString(),
      versions: '11,12,13,14,15,16,17,18,19,20,21,22,23',
      source_files: raw.files,
      raw_rows: raw.rows,
      player_editions: canonical.players,
      team_player_links: canonical.links,
    };
    for (const [key, value] of Object.entries(values)) metadata.run(key, String(value));
    const integrity = db.prepare('PRAGMA integrity_check').get() as SqlRow;
    if (integrity['integrity_check'] !== 'ok')
      throw new Error(`SQLite integrity check failed: ${integrity['integrity_check']}`);
    const foreignKeys = db.prepare('PRAGMA foreign_key_check').all();
    if (foreignKeys.length)
      throw new Error(`SQLite foreign key check found ${foreignKeys.length} errors.`);
    if (
      options.verifyExpectedCounts !== false &&
      (canonical.players !== EXPECTED_EDITIONS || canonical.links !== EXPECTED_TEAM_LINKS)
    )
      throw new Error(
        `Unexpected canonical counts: ${canonical.players} players, ${canonical.links} links.`,
      );
    db.exec(
      "INSERT INTO player_search(player_search) VALUES('optimize'); ANALYZE; PRAGMA journal_mode = DELETE; VACUUM;",
    );
    return {
      sourceFiles: raw.files,
      rawRows: raw.rows,
      playerEditions: canonical.players,
      teamLinks: canonical.links,
    };
  } finally {
    db.close();
  }
};
