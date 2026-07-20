import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  DATABASE_SCHEMA_VERSION,
  EXPECTED_EDITIONS,
  EXPECTED_LEAGUE_EDITIONS,
  EXPECTED_REFEREE_EDITIONS,
  EXPECTED_REFEREE_LEAGUE_LINKS,
  EXPECTED_STADIUM_EDITIONS,
  EXPECTED_STADIUM_TEAM_LINKS,
  EXPECTED_TEAM_EDITIONS,
  EXPECTED_TEAM_LINKS,
} from './importer';

const path = process.argv[2] ?? resolve(process.cwd(), 'resources', 'database', 'qdb.sqlite');
const db = new DatabaseSync(path, { readOnly: true });
const integrity = db.prepare('PRAGMA integrity_check').get()?.['integrity_check'];
const schemaVersion = db.prepare('PRAGMA user_version').get()?.['user_version'];
const metadataSchemaVersion = db
  .prepare("SELECT value FROM metadata WHERE key = 'schema_version'")
  .get()?.['value'];
const players = db.prepare('SELECT count(*) AS count FROM player_edition').get()?.['count'];
const links = db.prepare('SELECT count(*) AS count FROM player_team').get()?.['count'];
const teams = db.prepare('SELECT count(*) AS count FROM team_edition').get()?.['count'];
const leagues = db.prepare('SELECT count(*) AS count FROM league_edition').get()?.['count'];
const referees = db.prepare('SELECT count(*) AS count FROM referee_edition').get()?.['count'];
const stadiums = db.prepare('SELECT count(*) AS count FROM stadium_edition').get()?.['count'];
const refereeLeagueLinks = db.prepare('SELECT count(*) AS count FROM referee_league').get()?.[
  'count'
];
const stadiumTeamLinks = db.prepare('SELECT count(*) AS count FROM stadium_team').get()?.['count'];
const legacyWomenPlayers = db
  .prepare('SELECT count(*) AS count FROM player_edition WHERE version < 16 AND gender = 1')
  .get()?.['count'];
const currentWomenPlayers = db
  .prepare('SELECT count(*) AS count FROM player_edition WHERE version >= 16 AND gender = 1')
  .get()?.['count'];
const legacyWomenReferees = db
  .prepare('SELECT count(*) AS count FROM referee_edition WHERE version < 16 AND gender = 1')
  .get()?.['count'];
const currentWomenReferees = db
  .prepare('SELECT count(*) AS count FROM referee_edition WHERE version >= 16 AND gender = 1')
  .get()?.['count'];
const fts = db
  .prepare("SELECT count(*) AS count FROM player_search WHERE player_search MATCH 'messi'")
  .get()?.['count'];
db.close();
if (integrity !== 'ok') throw new Error(`Integrity check failed: ${String(integrity)}`);
if (
  Number(schemaVersion) !== DATABASE_SCHEMA_VERSION ||
  Number(metadataSchemaVersion) !== DATABASE_SCHEMA_VERSION
)
  throw new Error(
    `Expected database schema ${DATABASE_SCHEMA_VERSION}, found PRAGMA ${String(schemaVersion)} and metadata ${String(metadataSchemaVersion)}.`,
  );
if (Number(legacyWomenPlayers) !== 0 || Number(legacyWomenReferees) !== 0)
  throw new Error('FIFA 11–15 unexpectedly contains women player or referee editions.');
if (Number(currentWomenPlayers) === 0 || Number(currentWomenReferees) === 0)
  throw new Error('FIFA 16–23 is missing women player or referee editions.');
const counts = [
  [players, EXPECTED_EDITIONS, 'player editions'],
  [teams, EXPECTED_TEAM_EDITIONS, 'team editions'],
  [leagues, EXPECTED_LEAGUE_EDITIONS, 'league editions'],
  [referees, EXPECTED_REFEREE_EDITIONS, 'referee editions'],
  [stadiums, EXPECTED_STADIUM_EDITIONS, 'stadium editions'],
  [links, EXPECTED_TEAM_LINKS, 'team-player links'],
  [refereeLeagueLinks, EXPECTED_REFEREE_LEAGUE_LINKS, 'referee-league links'],
  [stadiumTeamLinks, EXPECTED_STADIUM_TEAM_LINKS, 'stadium-team links'],
] as const;
const unexpected = counts.find(([actual, expected]) => Number(actual) !== expected);
if (unexpected) {
  const [actual, expected, label] = unexpected;
  throw new Error(`Expected ${expected} ${label}, found ${String(actual)}.`);
}
console.log(
  `Database valid: ${String(players)} players, ${String(teams)} teams, ${String(leagues)} leagues, ${String(referees)} referees, ${String(stadiums)} stadiums, ${String(refereeLeagueLinks)} referee-league links, ${String(stadiumTeamLinks)} stadium-team links, ${String(links)} team-player links, ${String(fts)} Messi matches.`,
);
