import { existsSync, mkdirSync, readdirSync, renameSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { DatabaseDescriptor, DatabaseInfo, DatabaseKind } from '../src/app/core/qdb-contracts';
import { PlayerDatabase } from './database';
import { DATABASE_SCHEMA_VERSION } from './importer';

const BUILT_IN_ID = 'built-in';
const customFilePattern = /^([0-9a-f-]{36})\.sqlite$/i;

type Metadata = Record<string, string>;

const metadataInfo = (path: string): DatabaseInfo => {
  const database = new DatabaseSync(path, { readOnly: true });
  try {
    const metadata = Object.fromEntries(
      (
        database.prepare('SELECT key, value FROM metadata').all() as {
          key: string;
          value: string;
        }[]
      ).map(({ key, value }) => [key, value]),
    ) as Metadata;
    return {
      id: metadata['database_id'] ?? 'unknown',
      name: metadata['database_name'] ?? 'Unnamed database',
      kind: metadata['database_kind'] === 'custom' ? 'custom' : 'built-in',
      schemaVersion: Number(database.prepare('PRAGMA user_version').get()?.['user_version'] ?? 0),
      editions: Number(metadata['player_editions'] ?? 0),
      teamEditions: Number(metadata['team_editions'] ?? 0),
      leagueEditions: Number(metadata['league_editions'] ?? 0),
      refereeEditions: Number(metadata['referee_editions'] ?? 0),
      stadiumEditions: Number(metadata['stadium_editions'] ?? 0),
      teamLinks: Number(metadata['team_player_links'] ?? 0),
      sourceFiles: Number(metadata['source_files'] ?? 0),
      versions: (metadata['versions'] ?? '').split(',').filter(Boolean).map(Number),
      generatedAt: metadata['generated_at'] ?? '',
      sqliteVersion: String(
        database.prepare('SELECT sqlite_version() AS value').get()?.['value'] ?? '',
      ),
    };
  } finally {
    database.close();
  }
};

export class DatabaseLibrary {
  readonly customDirectory: string;

  constructor(
    private readonly builtInPath: string,
    userDataPath: string,
  ) {
    this.customDirectory = join(userDataPath, 'databases');
    mkdirSync(this.customDirectory, { recursive: true });
    this.cleanupTemporaryFiles();
  }

  list(): DatabaseDescriptor[] {
    this.ensureCustomDirectory();
    const paths = [
      this.builtInPath,
      ...readdirSync(this.customDirectory)
        .filter((file) => customFilePattern.test(file))
        .map((file) => join(this.customDirectory, file)),
    ];
    return paths
      .map((path) => this.describe(path))
      .sort((left, right) => {
        if (left.kind !== right.kind) return left.kind === 'built-in' ? -1 : 1;
        return left.name.localeCompare(right.name);
      });
  }

  pathFor(id: string): string {
    if (id === BUILT_IN_ID) return this.builtInPath;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid database identifier.');
    return join(this.customDirectory, `${id}.sqlite`);
  }

  temporaryPath(id: string): string {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid database identifier.');
    this.ensureCustomDirectory();
    return join(this.customDirectory, `${id}.importing`);
  }

  ensureUniqueName(name: string): void {
    const normalized = name.trim().toLocaleLowerCase('en');
    if (this.list().some((database) => database.name.toLocaleLowerCase('en') === normalized))
      throw new Error('A database with this name already exists.');
  }

  install(id: string): DatabaseDescriptor {
    const temporaryPath = this.temporaryPath(id);
    const destination = this.pathFor(id);
    const info = metadataInfo(temporaryPath);
    if (info.id !== id || info.kind !== 'custom' || info.schemaVersion !== DATABASE_SCHEMA_VERSION)
      throw new Error('The imported database metadata is invalid.');
    renameSync(temporaryPath, destination);
    return { ...info, status: 'available' };
  }

  remove(id: string): void {
    if (id === BUILT_IN_ID) throw new Error('The built-in database cannot be removed.');
    const path = this.pathFor(id);
    if (!existsSync(path)) throw new Error('Database was not found.');
    this.removeFiles(path);
  }

  customDatabaseIds(): string[] {
    this.ensureCustomDirectory();
    return readdirSync(this.customDirectory).flatMap((file) => {
      const match = customFilePattern.exec(file);
      return match?.[1] ? [match[1]] : [];
    });
  }

  removeCustomDatabases(): string[] {
    const ids = this.customDatabaseIds();
    const operationId = randomUUID();
    const staged: { source: string; destination: string }[] = [];
    try {
      for (const id of ids) {
        const path = this.pathFor(id);
        for (const source of [path, `${path}-wal`, `${path}-shm`]) {
          if (!existsSync(source)) continue;
          const destination = `${source}.deleting-${operationId}`;
          renameSync(source, destination);
          staged.push({ source, destination });
        }
      }
    } catch (error) {
      for (const { source, destination } of staged.reverse())
        if (existsSync(destination)) renameSync(destination, source);
      throw error;
    }
    for (const { destination } of staged) {
      try {
        unlinkSync(destination);
      } catch {
        // Staged files are no longer searchable and will be cleaned up on the next launch.
      }
    }
    return ids;
  }

  discardTemporary(id: string): void {
    this.removeFiles(this.temporaryPath(id));
  }

  private describe(path: string): DatabaseDescriptor {
    try {
      const database = new PlayerDatabase(path);
      const info = database.info();
      database.close();
      return { ...info, status: 'available' };
    } catch (error) {
      let info: DatabaseInfo;
      try {
        info = metadataInfo(path);
      } catch {
        const match = customFilePattern.exec(path.split(/[\\/]/).at(-1) ?? '');
        info = {
          id: match?.[1] ?? 'unknown',
          name: 'Unreadable database',
          kind: 'custom' as DatabaseKind,
          schemaVersion: 0,
          editions: 0,
          teamEditions: 0,
          leagueEditions: 0,
          refereeEditions: 0,
          stadiumEditions: 0,
          teamLinks: 0,
          sourceFiles: 0,
          versions: [],
          generatedAt: '',
          sqliteVersion: '',
        };
      }
      return {
        ...info,
        status: 'incompatible',
        error: error instanceof Error ? error.message : 'Database is unreadable.',
      };
    }
  }

  private cleanupTemporaryFiles(): void {
    this.ensureCustomDirectory();
    for (const file of readdirSync(this.customDirectory))
      if (
        file.endsWith('.importing') ||
        file.includes('.importing-') ||
        file.includes('.deleting-')
      )
        this.removeFiles(join(this.customDirectory, file));
  }

  private removeFiles(path: string): void {
    for (const candidate of [path, `${path}-wal`, `${path}-shm`]) {
      try {
        unlinkSync(candidate);
      } catch {
        // Missing cleanup targets are harmless.
      }
    }
  }

  private ensureCustomDirectory(): void {
    mkdirSync(this.customDirectory, { recursive: true });
  }
}
