import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { DatabaseLibrary } from '../../projects/electron/electron/database-library';

const CUSTOM_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_CUSTOM_ID = '22222222-2222-4222-8222-222222222222';

const createDatabase = (
  path: string,
  id: string,
  name: string,
  kind: 'built-in' | 'custom',
  schemaVersion = 3,
): void => {
  const database = new DatabaseSync(path);
  database.exec(
    `PRAGMA user_version = ${schemaVersion}; CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  );
  const insert = database.prepare('INSERT INTO metadata VALUES (?, ?)');
  for (const [key, value] of Object.entries({
    database_id: id,
    database_name: name,
    database_kind: kind,
    schema_version: schemaVersion,
    versions: kind === 'built-in' ? '11,12,13,14,15,16,17,18,19,20,21,22,23' : '23',
  }))
    insert.run(key, String(value));
  database.close();
};

describe('database library', () => {
  const directories: string[] = [];
  afterEach(() => directories.splice(0).forEach((path) => rmSync(path, { recursive: true })));

  const setup = (): { library: DatabaseLibrary; root: string } => {
    const root = mkdtempSync(join(tmpdir(), 'qdb-library-'));
    directories.push(root);
    const builtInPath = join(root, 'built-in.sqlite');
    createDatabase(builtInPath, 'built-in', 'Built-in FIFA 11–23', 'built-in');
    return { library: new DatabaseLibrary(builtInPath, root), root };
  };

  it('installs and removes an isolated custom database', () => {
    const { library } = setup();
    createDatabase(library.temporaryPath(CUSTOM_ID), CUSTOM_ID, 'Custom 23', 'custom');

    library.install(CUSTOM_ID);
    expect(library.list().map(({ name }) => name)).toEqual(['Built-in FIFA 11–23', 'Custom 23']);
    expect(() => library.ensureUniqueName(' custom 23 ')).toThrow(/already exists/);

    expect(library.remove(CUSTOM_ID)).toBeUndefined();
    expect(existsSync(library.pathFor(CUSTOM_ID))).toBe(false);
  });

  it('protects the built-in database and leaves incompatible files visible', () => {
    const { library } = setup();
    createDatabase(library.pathFor(CUSTOM_ID), CUSTOM_ID, 'Old database', 'custom', 2);

    expect(library.list().find(({ id }) => id === CUSTOM_ID)).toMatchObject({
      status: 'incompatible',
    });
    expect(() => library.remove('built-in')).toThrow(/cannot be removed/);
  });

  it('removes all managed custom databases while preserving the built-in database', () => {
    const { library } = setup();
    createDatabase(library.pathFor(CUSTOM_ID), CUSTOM_ID, 'Custom database', 'custom');
    createDatabase(
      library.pathFor(SECOND_CUSTOM_ID),
      SECOND_CUSTOM_ID,
      'Old database',
      'custom',
      0,
    );

    expect(new Set(library.removeCustomDatabases())).toEqual(
      new Set([CUSTOM_ID, SECOND_CUSTOM_ID]),
    );
    expect(library.list().map(({ id }) => id)).toEqual(['built-in']);
    expect(existsSync(library.pathFor(CUSTOM_ID))).toBe(false);
    expect(existsSync(library.pathFor(SECOND_CUSTOM_ID))).toBe(false);
  });

  it('recreates the managed directory if it is removed while the app is running', () => {
    const { library } = setup();
    rmSync(library.customDirectory, { recursive: true });

    expect(library.list()).toHaveLength(1);
    expect(existsSync(library.customDirectory)).toBe(true);
  });
});
