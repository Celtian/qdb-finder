import { readFile } from 'node:fs/promises';
import type { FifaDatabase } from 'fifa-t3db' with { 'resolution-mode': 'import' };
import type { Fifa } from 'fifatables';
import {
  inspectT3dbDatabase,
  type SourceHeaderInspection,
  type T3dbImportSource,
} from './importer';

export const openT3dbDatabase = async (
  databasePath: string,
  metadataPath: string,
): Promise<FifaDatabase> => {
  const [{ openFifaDatabase }, database, metadataXml] = await Promise.all([
    import('fifa-t3db'),
    readFile(databasePath),
    readFile(metadataPath, 'utf8'),
  ]);
  return openFifaDatabase({ database, metadataXml });
};

export const inspectT3dbSource = async (
  databasePath: string,
  metadataPath: string,
): Promise<SourceHeaderInspection> =>
  inspectT3dbDatabase(await openT3dbDatabase(databasePath, metadataPath));

export const createT3dbImportSource = async (
  fifa: Fifa,
  databasePath: string,
  metadataPath: string,
): Promise<T3dbImportSource> => ({
  kind: 't3db',
  fifa,
  databasePath,
  metadataPath,
  database: await openT3dbDatabase(databasePath, metadataPath),
});

export const t3dbSourceErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (/metadata|xml|schema/i.test(message))
    return 'The metadata XML is invalid or does not match the selected t3db database.';
  if (/format version|signature|platform|xbox/i.test(message))
    return 'The selected database is not a supported PC t3db format-8 database.';
  return 'The selected t3db database could not be opened. Check both source files and try again.';
};
