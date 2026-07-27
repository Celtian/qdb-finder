import { createRequire } from 'node:module';
import type { DatabaseSync as NodeDatabaseSync, SQLInputValue } from 'node:sqlite';

interface RuntimeSqlite {
  readonly Database?: typeof NodeDatabaseSync;
  readonly DatabaseSync?: typeof NodeDatabaseSync;
}

const loadRuntimeModule = createRequire(__filename);
const runtimeSqlite = loadRuntimeModule(
  process.versions['bun'] ? 'bun:sqlite' : 'node:sqlite',
) as RuntimeSqlite;
const databaseConstructor = runtimeSqlite.DatabaseSync ?? runtimeSqlite.Database;

if (!databaseConstructor) {
  throw new Error('The current runtime does not provide a synchronous SQLite database.');
}

export const DatabaseSync: typeof NodeDatabaseSync = databaseConstructor;
export type DatabaseSync = NodeDatabaseSync;
export type { SQLInputValue };
