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
export const EXPECTED_TEAM_EDITIONS = 8_907;
export const EXPECTED_LEAGUE_EDITIONS = 560;
export const EXPECTED_REFEREE_EDITIONS = 2_516;
export const EXPECTED_STADIUM_EDITIONS = 1_371;
export const EXPECTED_REFEREE_LEAGUE_LINKS = 3_001;
export const EXPECTED_STADIUM_TEAM_LINKS = 8_890;
export const POSITION_IDS = Object.values(Position);
const positionById = Object.fromEntries(POSITION_IDS.map((position, index) => [index, position]));

type RawRow = Record<string, string | number>;
type SqlRow = Record<string, string | number | null>;
type NationCodeValue = string | number | null | undefined;

export interface NationCodeRow {
  nationid?: NationCodeValue;
  isocountrycode?: NationCodeValue;
}

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
  teamEditions: number;
  leagueEditions: number;
  refereeEditions: number;
  stadiumEditions: number;
  refereeLeagueLinks: number;
  stadiumTeamLinks: number;
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
const optionalNumber = (value: string | number | null | undefined): number | null =>
  value === undefined || value === null ? null : Number(value);
const optionalPositiveNumber = (value: string | number | null | undefined): number | null => {
  const number = optionalNumber(value);
  return number && number > 0 ? number : null;
};

const nationalityCodeOverrides = new Map<number, string>([
  [14, 'gb-eng'],
  [35, 'gb-nir'],
  [42, 'gb-sct'],
  [50, 'gb-wls'],
  [219, 'xk'],
]);

export const collectNationalityCodes = (
  rows: readonly NationCodeRow[],
): ReadonlyMap<number, string> => {
  const codes = new Map<number, string>();
  for (const row of rows) {
    const nationId = asNumber(row.nationid);
    const code = asText(row.isocountrycode).toLocaleLowerCase('en');
    if (nationId !== 0 && code) codes.set(nationId, code);
  }
  return codes;
};

export const resolveNationalityCode = (
  nationId: number,
  sourceCode: NationCodeValue,
  fallbackCodes: ReadonlyMap<number, string>,
): string => {
  if (nationId === 0) return '';
  const override = nationalityCodeOverrides.get(nationId);
  if (override) return override;
  const normalizedSource = asText(sourceCode).toLocaleLowerCase('en');
  return normalizedSource || fallbackCodes.get(nationId) || '';
};
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
    nationality_id INTEGER NOT NULL, nationality_code TEXT NOT NULL,
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
  CREATE TABLE league_edition (
    key TEXT PRIMARY KEY, version INTEGER NOT NULL, league_id INTEGER NOT NULL,
    league_key TEXT NOT NULL, league_name TEXT NOT NULL, country_id INTEGER,
    country_name TEXT NOT NULL, country_code TEXT NOT NULL, level INTEGER,
    is_women INTEGER, team_count INTEGER NOT NULL DEFAULT 0,
    player_count INTEGER NOT NULL DEFAULT 0, raw_json TEXT NOT NULL,
    UNIQUE(version, league_id)
  );
  CREATE TABLE team_edition (
    key TEXT PRIMARY KEY, version INTEGER NOT NULL, team_id INTEGER NOT NULL,
    team_key TEXT NOT NULL, team_name TEXT NOT NULL, league_id INTEGER,
    league_key TEXT NOT NULL, league_name TEXT NOT NULL, country_id INTEGER,
    country_name TEXT NOT NULL, country_code TEXT NOT NULL,
    squad_size INTEGER NOT NULL DEFAULT 0, overall INTEGER, attack INTEGER,
    midfield INTEGER, defence INTEGER, foundation_year INTEGER, raw_json TEXT NOT NULL,
    UNIQUE(version, team_id)
  );
  CREATE TABLE referee_edition (
    key TEXT PRIMARY KEY, version INTEGER NOT NULL, referee_id INTEGER NOT NULL,
    referee_key TEXT NOT NULL, referee_name TEXT NOT NULL, first_name TEXT NOT NULL,
    last_name TEXT NOT NULL, nationality_id INTEGER NOT NULL,
    nationality_key TEXT NOT NULL, nationality_name TEXT NOT NULL, nationality_code TEXT NOT NULL,
    birth_date TEXT, snapshot_date TEXT NOT NULL, age INTEGER, height INTEGER, weight INTEGER,
    foul_strictness INTEGER, card_strictness INTEGER, is_real INTEGER,
    league_count INTEGER NOT NULL DEFAULT 0, raw_json TEXT NOT NULL,
    UNIQUE(version, referee_id)
  );
  CREATE TABLE stadium_edition (
    key TEXT PRIMARY KEY, version INTEGER NOT NULL, stadium_id INTEGER NOT NULL,
    stadium_key TEXT NOT NULL, stadium_name TEXT NOT NULL, country_id INTEGER,
    country_name TEXT NOT NULL, country_code TEXT NOT NULL, capacity INTEGER NOT NULL,
    year_built INTEGER, pitch_length INTEGER, pitch_width INTEGER,
    is_licensed INTEGER, is_small_sided INTEGER,
    team_count INTEGER NOT NULL DEFAULT 0, raw_json TEXT NOT NULL,
    UNIQUE(version, stadium_id)
  );
  CREATE TABLE referee_league (
    referee_key TEXT NOT NULL REFERENCES referee_edition(key) ON DELETE CASCADE,
    version INTEGER NOT NULL, referee_id INTEGER NOT NULL, league_id INTEGER NOT NULL,
    league_key TEXT NOT NULL, league_name TEXT NOT NULL,
    PRIMARY KEY(referee_key, league_id)
  );
  CREATE TABLE stadium_team (
    stadium_key TEXT NOT NULL REFERENCES stadium_edition(key) ON DELETE CASCADE,
    version INTEGER NOT NULL, stadium_id INTEGER NOT NULL, team_id INTEGER NOT NULL,
    team_key TEXT NOT NULL, team_name TEXT NOT NULL,
    PRIMARY KEY(stadium_key, team_id)
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
): {
  players: number;
  links: number;
  teams: number;
  leagues: number;
  referees: number;
  stadiums: number;
  refereeLeagueLinks: number;
  stadiumTeamLinks: number;
} => {
  const playerInsert = db.prepare(
    `INSERT INTO player_edition VALUES (${Array.from({ length: 29 }, () => '?').join(',')})`,
  );
  const linkInsert = db.prepare(
    'INSERT OR IGNORE INTO player_team VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const teamInsert = db.prepare(
    `INSERT INTO team_edition VALUES (${Array.from({ length: 18 }, () => '?').join(',')})`,
  );
  const leagueInsert = db.prepare(
    `INSERT INTO league_edition VALUES (${Array.from({ length: 13 }, () => '?').join(',')})`,
  );
  const refereeInsert = db.prepare(
    `INSERT INTO referee_edition VALUES (${Array.from({ length: 21 }, () => '?').join(',')})`,
  );
  const stadiumInsert = db.prepare(
    `INSERT INTO stadium_edition VALUES (${Array.from({ length: 16 }, () => '?').join(',')})`,
  );
  const refereeLeagueInsert = db.prepare(
    'INSERT OR IGNORE INTO referee_league VALUES (?, ?, ?, ?, ?, ?)',
  );
  const stadiumTeamInsert = db.prepare(
    'INSERT OR IGNORE INTO stadium_team VALUES (?, ?, ?, ?, ?, ?)',
  );
  const nationalityCodeFallback = collectNationalityCodes(
    FIFAS.filter((fifa) => Number(fifa.slice(4)) >= 16).flatMap((fifa) =>
      tableRows(db, fifa, Table.Nations),
    ),
  );
  let players = 0;
  let links = 0;
  let teamsCount = 0;
  let leaguesCount = 0;
  let refereesCount = 0;
  let stadiumsCount = 0;
  let refereeLeagueLinks = 0;
  let stadiumTeamLinks = 0;
  for (const fifa of FIFAS) {
    const version = Number(fifa.slice(4));
    const snapshot = versionSnapshot(examplesPath, fifa);
    const names = mapBy(tableRows(db, fifa, Table.PlayerNames), 'nameid', 'name');
    const nationRows = tableRows(db, fifa, Table.Nations);
    const nations = mapBy(nationRows, 'nationid', 'nationname');
    const nationCodes = new Map(
      nationRows.map((row) => {
        const nationId = asNumber(row['nationid']);
        return [
          nationId,
          resolveNationalityCode(nationId, row['isocountrycode'], nationalityCodeFallback),
        ];
      }),
    );
    const teamRows = tableRows(db, fifa, Table.Teams);
    const leagueRows = tableRows(db, fifa, Table.Leagues);
    const teams = mapBy(teamRows, 'teamid', 'teamname');
    const leagues = mapBy(leagueRows, 'leagueid', 'leaguename');
    const teamIds = new Set(teamRows.map((row) => asNumber(row['teamid'])));
    const leagueIds = new Set(leagueRows.map((row) => asNumber(row['leagueid'])));
    const refereeRows = tableRows(db, fifa, Table.Referee);
    const stadiumRows = tableRows(db, fifa, Table.Stadiums);
    const refereeIds = new Set(refereeRows.map((row) => asNumber(row['refereeid'])));
    const stadiumIds = new Set(stadiumRows.map((row) => asNumber(row['stadiumid'])));
    const leagueRowsById = new Map(leagueRows.map((row) => [asNumber(row['leagueid']), row]));
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
      for (const league of leagueRows) {
        const leagueId = asNumber(league['leagueid']);
        const leagueName = asText(league['leaguename']);
        const countryId = optionalNumber(league['countryid']);
        leagueInsert.run(
          `${version}:${leagueId}`,
          version,
          leagueId,
          normalize(leagueName),
          leagueName,
          countryId,
          countryId === null ? '' : (nations.get(countryId) ?? ''),
          countryId === null ? '' : (nationCodes.get(countryId) ?? ''),
          optionalNumber(league['level']),
          league['iswomencompetition'] === undefined
            ? null
            : Number(Boolean(asNumber(league['iswomencompetition']))),
          0,
          0,
          JSON.stringify(league),
        );
        leaguesCount += 1;
      }
      for (const team of teamRows) {
        const teamId = asNumber(team['teamid']);
        const teamName = asText(team['teamname']);
        const leagueId = teamLeagues.get(teamId) ?? null;
        const league = leagueId === null ? undefined : leagueRowsById.get(leagueId);
        const leagueName = leagueId === null ? '' : (leagues.get(leagueId) ?? '');
        const countryId = league ? optionalNumber(league['countryid']) : null;
        teamInsert.run(
          `${version}:${teamId}`,
          version,
          teamId,
          normalize(teamName),
          teamName,
          leagueId,
          normalize(leagueName),
          leagueName,
          countryId,
          countryId === null ? '' : (nations.get(countryId) ?? ''),
          countryId === null ? '' : (nationCodes.get(countryId) ?? ''),
          0,
          optionalNumber(team['overallrating']),
          optionalNumber(team['attackrating']),
          optionalNumber(team['midfieldrating']),
          optionalNumber(team['defenserating']),
          optionalPositiveNumber(team['foundationyear']),
          JSON.stringify(team),
        );
        teamsCount += 1;
      }
      for (const referee of refereeRows) {
        const refereeId = asNumber(referee['refereeid']);
        const firstName = asText(referee['firstname']);
        const lastName = asText(referee['surname']);
        const refereeName =
          [firstName, lastName].filter(Boolean).join(' ') || `Referee ${refereeId}`;
        const nationalityId = asNumber(referee['nationalitycode']);
        const nationalityName = nations.get(nationalityId) ?? '';
        const birthDate = isoDate(asNumber(referee['birthdate']));
        refereeInsert.run(
          `${version}:${refereeId}`,
          version,
          refereeId,
          normalize(refereeName),
          refereeName,
          firstName,
          lastName,
          nationalityId,
          normalize(nationalityName),
          nationalityName,
          nationCodes.get(nationalityId) ?? '',
          birthDate,
          snapshot,
          ageAt(birthDate, snapshot),
          optionalPositiveNumber(referee['height']),
          optionalPositiveNumber(referee['weight']),
          optionalNumber(referee['foulstrictness']),
          optionalNumber(referee['cardstrictness']),
          referee['isreal'] === undefined ? null : Number(Boolean(asNumber(referee['isreal']))),
          0,
          JSON.stringify(referee),
        );
        refereesCount += 1;
      }
      for (const stadium of stadiumRows) {
        const stadiumId = asNumber(stadium['stadiumid']);
        const stadiumName = asText(stadium['name']) || `Stadium ${stadiumId}`;
        const countryId = optionalPositiveNumber(stadium['countrycode']);
        stadiumInsert.run(
          `${version}:${stadiumId}`,
          version,
          stadiumId,
          normalize(stadiumName),
          stadiumName,
          countryId,
          countryId === null ? '' : (nations.get(countryId) ?? ''),
          countryId === null ? '' : (nationCodes.get(countryId) ?? ''),
          asNumber(stadium['capacity']),
          optionalPositiveNumber(stadium['yearbuilt']),
          optionalPositiveNumber(stadium['stadiumpitchlength']),
          optionalPositiveNumber(stadium['stadiumpitchwidth']),
          stadium['islicensed'] === undefined
            ? null
            : Number(Boolean(asNumber(stadium['islicensed']))),
          stadium['issmallsided'] === undefined
            ? null
            : Number(Boolean(asNumber(stadium['issmallsided']))),
          0,
          JSON.stringify(stadium),
        );
        stadiumsCount += 1;
      }
      const refereeLeagueRows =
        fifa === Fifa.Fifa11
          ? refereeRows.map((referee) => ({
              refereeid: referee['refereeid'],
              leagueid: referee['leagueid'],
            }))
          : tableRows(db, fifa, Table.LeagueRefereeLinks);
      for (const link of refereeLeagueRows) {
        const refereeId = asNumber(link['refereeid']);
        const leagueId = asNumber(link['leagueid']);
        if (!refereeIds.has(refereeId) || !leagueIds.has(leagueId)) continue;
        const result = refereeLeagueInsert.run(
          `${version}:${refereeId}`,
          version,
          refereeId,
          leagueId,
          normalize(leagues.get(leagueId) ?? ''),
          leagues.get(leagueId) ?? '',
        );
        refereeLeagueLinks += Number(result.changes);
      }
      for (const link of tableRows(db, fifa, Table.TeamStadiumLinks)) {
        const stadiumId = asNumber(link['stadiumid']);
        const teamId = asNumber(link['teamid']);
        if (!stadiumIds.has(stadiumId) || !teamIds.has(teamId)) continue;
        const result = stadiumTeamInsert.run(
          `${version}:${stadiumId}`,
          version,
          stadiumId,
          teamId,
          normalize(teams.get(teamId) ?? ''),
          teams.get(teamId) ?? '',
        );
        stadiumTeamLinks += Number(result.changes);
      }
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
        const nationalityId = asNumber(player['nationality']);
        const nationality = nations.get(nationalityId) ?? '';
        const nationalityCode = nationCodes.get(nationalityId) ?? '';
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
          nationalityId,
          nationalityCode,
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
    CREATE INDEX idx_player_team_edition ON player_team(version, team_id);
    CREATE INDEX idx_player_league_edition ON player_team(version, league_id);
    CREATE INDEX idx_team_league_edition ON team_edition(version, league_id);
    CREATE INDEX idx_referee_league_edition ON referee_league(version, league_id);
    CREATE INDEX idx_stadium_team_edition ON stadium_team(version, team_id);
    UPDATE team_edition SET squad_size = (
      SELECT count(DISTINCT player_key) FROM player_team pt
      WHERE pt.version = team_edition.version AND pt.team_id = team_edition.team_id
    );
    UPDATE league_edition SET
      team_count = (
        SELECT count(*) FROM team_edition t
        WHERE t.version = league_edition.version AND t.league_id = league_edition.league_id
      ),
      player_count = (
        SELECT count(DISTINCT player_key) FROM player_team pt
        WHERE pt.version = league_edition.version AND pt.league_id = league_edition.league_id
      );
    UPDATE referee_edition SET league_count = (
      SELECT count(*) FROM referee_league rl WHERE rl.referee_key = referee_edition.key
    );
    UPDATE stadium_edition SET team_count = (
      SELECT count(*) FROM stadium_team st WHERE st.stadium_key = stadium_edition.key
    );
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
    CREATE INDEX idx_team_edition_version ON team_edition(version);
    CREATE INDEX idx_team_edition_name ON team_edition(team_key);
    CREATE INDEX idx_team_edition_league ON team_edition(league_key);
    CREATE INDEX idx_team_edition_country ON team_edition(country_id);
    CREATE INDEX idx_team_edition_overall ON team_edition(overall);
    CREATE INDEX idx_league_edition_version ON league_edition(version);
    CREATE INDEX idx_league_edition_name ON league_edition(league_key);
    CREATE INDEX idx_league_edition_country ON league_edition(country_id);
    CREATE INDEX idx_referee_edition_version ON referee_edition(version);
    CREATE INDEX idx_referee_edition_name ON referee_edition(referee_key);
    CREATE INDEX idx_referee_edition_nation ON referee_edition(nationality_id);
    CREATE INDEX idx_referee_edition_age ON referee_edition(age);
    CREATE INDEX idx_referee_league_key ON referee_league(league_key);
    CREATE INDEX idx_referee_league_referee ON referee_league(referee_key);
    CREATE INDEX idx_stadium_edition_version ON stadium_edition(version);
    CREATE INDEX idx_stadium_edition_name ON stadium_edition(stadium_key);
    CREATE INDEX idx_stadium_edition_country ON stadium_edition(country_id);
    CREATE INDEX idx_stadium_edition_capacity ON stadium_edition(capacity);
    CREATE INDEX idx_stadium_team_key ON stadium_team(team_key);
    CREATE INDEX idx_stadium_team_stadium ON stadium_team(stadium_key);
  `);
  return {
    players,
    links,
    teams: teamsCount,
    leagues: leaguesCount,
    referees: refereesCount,
    stadiums: stadiumsCount,
    refereeLeagueLinks,
    stadiumTeamLinks,
  };
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
      team_editions: canonical.teams,
      league_editions: canonical.leagues,
      referee_editions: canonical.referees,
      stadium_editions: canonical.stadiums,
      referee_league_links: canonical.refereeLeagueLinks,
      stadium_team_links: canonical.stadiumTeamLinks,
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
      (canonical.players !== EXPECTED_EDITIONS ||
        canonical.links !== EXPECTED_TEAM_LINKS ||
        canonical.teams !== EXPECTED_TEAM_EDITIONS ||
        canonical.leagues !== EXPECTED_LEAGUE_EDITIONS ||
        canonical.referees !== EXPECTED_REFEREE_EDITIONS ||
        canonical.stadiums !== EXPECTED_STADIUM_EDITIONS ||
        canonical.refereeLeagueLinks !== EXPECTED_REFEREE_LEAGUE_LINKS ||
        canonical.stadiumTeamLinks !== EXPECTED_STADIUM_TEAM_LINKS)
    )
      throw new Error(
        `Unexpected canonical counts: ${canonical.players} players, ${canonical.teams} teams, ${canonical.leagues} leagues, ${canonical.referees} referees, ${canonical.stadiums} stadiums, ${canonical.links} player-team links, ${canonical.refereeLeagueLinks} referee-league links, ${canonical.stadiumTeamLinks} stadium-team links.`,
      );
    db.exec(
      "INSERT INTO player_search(player_search) VALUES('optimize'); ANALYZE; PRAGMA journal_mode = DELETE; VACUUM;",
    );
    return {
      sourceFiles: raw.files,
      rawRows: raw.rows,
      playerEditions: canonical.players,
      teamLinks: canonical.links,
      teamEditions: canonical.teams,
      leagueEditions: canonical.leagues,
      refereeEditions: canonical.referees,
      stadiumEditions: canonical.stadiums,
      refereeLeagueLinks: canonical.refereeLeagueLinks,
      stadiumTeamLinks: canonical.stadiumTeamLinks,
    };
  } finally {
    db.close();
  }
};
