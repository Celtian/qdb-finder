import { randomUUID } from 'node:crypto';

export type SelectedDatabaseSource =
  | { kind: 'text-folder'; path: string }
  | { kind: 't3db'; databasePath: string; metadataPath: string };

export type SelectedT3dbFileKind = 'database' | 'metadata';

interface SelectedT3dbFile {
  kind: SelectedT3dbFileKind;
  path: string;
}

export class DatabaseSourceSelections {
  private readonly sources = new Map<string, SelectedDatabaseSource>();
  private readonly t3dbFiles = new Map<string, SelectedT3dbFile>();

  constructor(private readonly createId: () => string = randomUUID) {}

  addTextSource(path: string): string {
    const id = this.createId();
    this.sources.set(id, { kind: 'text-folder', path });
    return id;
  }

  addT3dbFile(kind: SelectedT3dbFileKind, path: string): string {
    const id = this.createId();
    this.t3dbFiles.set(id, { kind, path });
    return id;
  }

  resolveT3dbPair(
    databaseFileId: string,
    metadataFileId: string,
  ): Extract<SelectedDatabaseSource, { kind: 't3db' }> | undefined {
    const database = this.t3dbFiles.get(databaseFileId);
    const metadata = this.t3dbFiles.get(metadataFileId);
    if (database?.kind !== 'database' || metadata?.kind !== 'metadata') return undefined;
    return {
      kind: 't3db',
      databasePath: database.path,
      metadataPath: metadata.path,
    };
  }

  addT3dbSource(
    source: Extract<SelectedDatabaseSource, { kind: 't3db' }>,
    databaseFileId: string,
    metadataFileId: string,
  ): string {
    const id = this.createId();
    this.sources.set(id, source);
    this.t3dbFiles.delete(databaseFileId);
    this.t3dbFiles.delete(metadataFileId);
    return id;
  }

  get(selectionId: string): SelectedDatabaseSource | undefined {
    return this.sources.get(selectionId);
  }

  consume(selectionId: string): void {
    this.sources.delete(selectionId);
  }

  clear(): void {
    this.sources.clear();
    this.t3dbFiles.clear();
  }
}
