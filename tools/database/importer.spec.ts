import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Datatype, type Field } from 'fifatables';
import { decodeFifaText, parseTsvLine, readTable } from './importer';

describe('FIFA text importer', () => {
  const directories: string[] = [];
  afterEach(() =>
    directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true })),
  );

  it('decodes a UTF-16LE BOM and CRLF text', () => {
    const content = Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from('name\tvalue\r\nMessi\t10', 'utf16le'),
    ]);
    expect(decodeFifaText(content)).toBe('name\tvalue\r\nMessi\t10');
  });
  it('parses empty and quoted TSV fields', () => {
    expect(parseTsvLine('a\t\t"Lionel ""Leo"" Messi"')).toEqual(['a', '', 'Lionel "Leo" Messi']);
  });

  it('validates headers and converts configured values', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-import-'));
    directories.push(directory);
    const path = join(directory, 'sample.txt');
    const fields: Field[] = [
      { name: 'id', order: 0, type: Datatype.Int, default: 0 },
      { name: 'rating', order: 1, type: Datatype.Float, default: 0 },
      { name: 'name', order: 2, type: Datatype.String, default: '' },
    ];
    writeFileSync(
      path,
      Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from('id\trating\tname\r\n7\t81,5\tJosé', 'utf16le'),
      ]),
    );
    expect(readTable(path, fields)).toEqual([{ id: 7, rating: 81.5, name: 'José' }]);
    writeFileSync(
      path,
      Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('wrong\r\n7', 'utf16le')]),
    );
    expect(() => readTable(path, fields)).toThrow(/Header mismatch/);
  });
});
