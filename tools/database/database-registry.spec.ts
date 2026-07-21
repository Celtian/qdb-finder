import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { DatabaseLibrary } from '../../projects/electron/electron/database-library';
import { DatabaseRegistry } from '../../projects/electron/electron/database-registry';
import { defaultSearchRequest } from '../../projects/electron/src/app/core/qdb-contracts';

const CUSTOM_ID = '11111111-1111-4111-8111-111111111111';

interface TestPlayer {
  id: number;
  name: string;
  overall: number;
  nationality?: string;
}

const createDatabase = (
  path: string,
  id: string,
  name: string,
  kind: 'built-in' | 'custom',
  players: TestPlayer[],
): void => {
  const database = new DatabaseSync(path);
  database.exec(`
    PRAGMA user_version = 1;
    CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE player_edition (
      key TEXT PRIMARY KEY,
      version INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      display_name TEXT NOT NULL,
      nationality_key TEXT NOT NULL,
      nationality_name TEXT NOT NULL,
      nationality_code TEXT NOT NULL,
      positions TEXT NOT NULL,
      age INTEGER,
      overall INTEGER NOT NULL,
      potential INTEGER NOT NULL,
      best_position TEXT NOT NULL,
      best_rating INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      common_name TEXT NOT NULL,
      jersey_name TEXT NOT NULL,
      birth_date TEXT,
      snapshot_date TEXT NOT NULL,
      height INTEGER,
      weight INTEGER,
      preferred_foot TEXT NOT NULL,
      attacking_work_rate TEXT NOT NULL,
      defensive_work_rate TEXT NOT NULL,
      attributes_json TEXT NOT NULL,
      ratings_json TEXT NOT NULL,
      raw_json TEXT NOT NULL
    );
    CREATE TABLE player_team (
      player_key TEXT NOT NULL,
      version INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      league_id INTEGER NOT NULL,
      team_key TEXT NOT NULL,
      team_name TEXT NOT NULL,
      league_key TEXT NOT NULL,
      league_name TEXT NOT NULL
    );
  `);
  const metadata = database.prepare('INSERT INTO metadata VALUES (?, ?)');
  for (const [key, value] of Object.entries({
    database_id: id,
    database_name: name,
    database_kind: kind,
    schema_version: 1,
    player_editions: players.length,
    versions: '23',
  }))
    metadata.run(key, String(value));
  const insert = database.prepare(
    `INSERT INTO player_edition VALUES (
      ?, 23, ?, ?, ?, ?, 'gb-eng', 'ST', 25, ?, ?, 'ST', ?,
      '', '', '', '', NULL, '2022-09-01', NULL, NULL, '', '', '', '{}', '{}', '{}'
    )`,
  );
  for (const player of players) {
    const nationality = player.nationality ?? 'England';
    insert.run(
      `23:${player.id}`,
      player.id,
      player.name,
      nationality.toLocaleLowerCase('en'),
      nationality,
      player.overall,
      player.overall,
      player.overall,
    );
  }
  database.close();
};

describe('database registry', () => {
  const directories: string[] = [];
  afterEach(() => directories.splice(0).forEach((path) => rmSync(path, { recursive: true })));

  const setup = (): { library: DatabaseLibrary; registry: DatabaseRegistry } => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-registry-'));
    directories.push(root);
    const builtInPath = join(root, 'built-in.sqlite');
    createDatabase(builtInPath, 'built-in', 'Built-in', 'built-in', [
      { id: 1, name: 'Shared Player', overall: 90 },
      { id: 2, name: 'Built-in Player', overall: 80 },
    ]);
    const library = new DatabaseLibrary(builtInPath, root);
    createDatabase(library.pathFor(CUSTOM_ID), CUSTOM_ID, 'Custom', 'custom', [
      { id: 1, name: 'Modified Player', overall: 95 },
    ]);
    return { library, registry: new DatabaseRegistry(library) };
  };

  it('merges totals, stable sorting and pagination while preserving database identity', () => {
    const { registry } = setup();
    const request = {
      ...defaultSearchRequest(),
      sort: 'overall' as const,
      direction: 'desc' as const,
      pageSize: 2,
    };

    const first = registry.searchPlayers(request);
    const second = registry.searchPlayers({ ...request, offset: 2 });

    expect(first.total).toBe(3);
    expect(first.rows.map(({ databaseName, name }) => [databaseName, name])).toEqual([
      ['Custom', 'Modified Player'],
      ['Built-in', 'Shared Player'],
    ]);
    expect(second.rows.map(({ name }) => name)).toEqual(['Built-in Player']);
    expect(new Set([...first.rows, ...second.rows].map(({ key }) => key)).size).toBe(3);
    registry.close();
  });

  it('filters databases and resolves duplicate edition IDs against the requested source', () => {
    const { registry } = setup();
    const builtIn = registry.searchPlayers({
      ...defaultSearchRequest(),
      databaseIds: ['built-in'],
    });

    expect(builtIn.total).toBe(2);
    expect(builtIn.rows.every(({ databaseId }) => databaseId === 'built-in')).toBe(true);
    expect(registry.getPlayer({ databaseId: CUSTOM_ID, version: 23, playerId: 1 }).name).toBe(
      'Modified Player',
    );
    expect(
      registry.searchPlayers({ ...defaultSearchRequest(), databaseIds: ['missing'] }),
    ).toMatchObject({ total: 0, rows: [] });
    registry.close();
  });

  it('aggregates suggestions across the selected databases', () => {
    const { registry } = setup();

    expect(
      registry.suggest({
        databaseIds: [],
        kind: 'nationality',
        text: '',
        versions: [23],
      })[0],
    ).toMatchObject({ key: 'england', label: 'England', count: 3 });
    registry.close();
  });

  it('closes and removes a custom database from subsequent searches', () => {
    const { library, registry } = setup();

    registry.closeDatabase(CUSTOM_ID);
    library.remove(CUSTOM_ID);
    registry.refresh();

    expect(registry.searchPlayers(defaultSearchRequest()).total).toBe(2);
    registry.close();
  });
});
