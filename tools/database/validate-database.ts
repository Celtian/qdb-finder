import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const path = process.argv[2] ?? resolve(process.cwd(), 'resources', 'database', 'qdb.sqlite');
const db = new DatabaseSync(path, { readOnly: true });
const integrity = db.prepare('PRAGMA integrity_check').get()?.['integrity_check'];
const players = db.prepare('SELECT count(*) AS count FROM player_edition').get()?.['count'];
const links = db.prepare('SELECT count(*) AS count FROM player_team').get()?.['count'];
const fts = db
  .prepare("SELECT count(*) AS count FROM player_search WHERE player_search MATCH 'messi'")
  .get()?.['count'];
db.close();
if (integrity !== 'ok') throw new Error(`Integrity check failed: ${String(integrity)}`);
console.log(
  `Database valid: ${String(players)} players, ${String(links)} links, ${String(fts)} Messi matches.`,
);
