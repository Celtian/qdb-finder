import { describe, expect, it } from 'vitest';
import { DatabaseSourceSelections } from '../../projects/electron/electron/database-source-selections';

const ids = (...values: string[]): (() => string) => {
  const remaining = [...values];
  return () => remaining.shift() ?? 'unexpected-id';
};

describe('database source selections', () => {
  it('keeps paths behind opaque ids and pairs files only by their expected roles', () => {
    const selections = new DatabaseSourceSelections(
      ids('database-token', 'metadata-token', 'source-token'),
    );
    const databaseFileId = selections.addT3dbFile('database', '/private/fifa_ng_db.db');
    const metadataFileId = selections.addT3dbFile('metadata', '/private/fifa_ng_db-meta.xml');

    expect(databaseFileId).toBe('database-token');
    expect(metadataFileId).toBe('metadata-token');
    expect(databaseFileId).not.toContain('/private');
    expect(selections.resolveT3dbPair(databaseFileId, metadataFileId)).toEqual({
      kind: 't3db',
      databasePath: '/private/fifa_ng_db.db',
      metadataPath: '/private/fifa_ng_db-meta.xml',
    });
    expect(selections.resolveT3dbPair(metadataFileId, databaseFileId)).toBeUndefined();
    expect(selections.resolveT3dbPair('missing', metadataFileId)).toBeUndefined();
  });

  it('consumes file tokens after preparation and consumes a source after installation', () => {
    const selections = new DatabaseSourceSelections(
      ids('database-token', 'metadata-token', 'source-token'),
    );
    const databaseFileId = selections.addT3dbFile('database', '/private/fifa_ng_db.db');
    const metadataFileId = selections.addT3dbFile('metadata', '/private/fifa_ng_db-meta.xml');
    const source = selections.resolveT3dbPair(databaseFileId, metadataFileId);
    expect(source).toBeDefined();

    const selectionId = selections.addT3dbSource(
      source as NonNullable<typeof source>,
      databaseFileId,
      metadataFileId,
    );

    expect(selections.resolveT3dbPair(databaseFileId, metadataFileId)).toBeUndefined();
    expect(selections.get(selectionId)).toEqual(source);
    selections.consume(selectionId);
    expect(selections.get(selectionId)).toBeUndefined();
  });

  it('registers text folders without exposing their paths as selection ids', () => {
    const selections = new DatabaseSourceSelections(ids('text-token'));

    const selectionId = selections.addTextSource('/private/exported-tables');

    expect(selectionId).toBe('text-token');
    expect(selections.get(selectionId)).toEqual({
      kind: 'text-folder',
      path: '/private/exported-tables',
    });
  });
});
