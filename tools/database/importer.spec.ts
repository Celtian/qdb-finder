import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Datatype, type Field } from 'fifatables';
import {
  collectNationalityCodes,
  decodeFifaText,
  normalizeGender,
  parseTsvLine,
  readTable,
  resolveNationalityCode,
} from './importer';

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

  it('extracts lowercase Nations-table codes for stable nation IDs', () => {
    expect(
      collectNationalityCodes([
        { nationid: 54, isocountrycode: ' DE ' },
        { nationid: 0, isocountrycode: 'XX' },
        { nationid: 219, isocountrycode: '' },
      ]),
    ).toEqual(new Map([[54, 'de']]));
  });

  it('uses later-edition codes for Nations tables without ISO data', () => {
    const fallback = collectNationalityCodes([{ nationid: 54, isocountrycode: 'DE' }]);

    expect(resolveNationalityCode(54, undefined, fallback)).toBe('de');
    expect(resolveNationalityCode(54, 'FR', fallback)).toBe('fr');
  });

  it.each([
    [14, 'gb-eng'],
    [35, 'gb-nir'],
    [42, 'gb-sct'],
    [50, 'gb-wls'],
    [219, 'xk'],
  ])('applies the identifier override for nation %i', (nationId, code) => {
    expect(resolveNationalityCode(nationId, 'GB', new Map())).toBe(code);
  });

  it('does not render a flag for nation zero or a missing code', () => {
    expect(resolveNationalityCode(0, 'XX', new Map([[0, 'xx']]))).toBe('');
    expect(resolveNationalityCode(999, '', new Map())).toBe('');
  });

  it('normalizes source gender and treats missing legacy values as men', () => {
    expect(normalizeGender(undefined)).toBe(0);
    expect(normalizeGender(null)).toBe(0);
    expect(normalizeGender(0)).toBe(0);
    expect(normalizeGender('0')).toBe(0);
    expect(normalizeGender(1)).toBe(1);
    expect(normalizeGender('1')).toBe(1);
  });
});
