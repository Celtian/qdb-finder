import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { Datatype, type Field } from 'fifatables';
import {
  buildDatabase,
  collectNationalityCodes,
  decodeFifaText,
  EXPECTED_EDITIONS,
  EXPECTED_LEAGUE_EDITIONS,
  EXPECTED_REFEREE_EDITIONS,
  EXPECTED_REFEREE_LEAGUE_LINKS,
  EXPECTED_STADIUM_EDITIONS,
  EXPECTED_STADIUM_TEAM_LINKS,
  EXPECTED_TEAM_EDITIONS,
  EXPECTED_TEAM_LINKS,
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
    expect(decodeFifaText(Buffer.from('plain', 'utf16le'))).toBe('plain');
    expect(() => decodeFifaText(Buffer.from([0xfe, 0xff]))).toThrow(/UTF-16BE/);
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

    writeFileSync(path, Buffer.alloc(0));
    expect(readTable(path, fields)).toEqual([]);

    writeFileSync(
      path,
      Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from('id\trating\tname\r\n7\t81,5', 'utf16le'),
      ]),
    );
    expect(() => readTable(path, fields)).toThrow(/Column mismatch/);
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

  it('builds and verifies the complete generated database in an isolated directory', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-build-'));
    directories.push(directory);
    const progress: string[] = [];

    const summary = buildDatabase({
      examplesPath: join(process.cwd(), 'examples'),
      outputPath: join(directory, 'qdb.sqlite'),
      verifyExpectedCounts: true,
      progress: (message) => progress.push(message),
    });

    expect(summary).toMatchObject({
      sourceFiles: 306,
      playerEditions: EXPECTED_EDITIONS,
      teamLinks: EXPECTED_TEAM_LINKS,
      teamEditions: EXPECTED_TEAM_EDITIONS,
      leagueEditions: EXPECTED_LEAGUE_EDITIONS,
      refereeEditions: EXPECTED_REFEREE_EDITIONS,
      stadiumEditions: EXPECTED_STADIUM_EDITIONS,
      refereeLeagueLinks: EXPECTED_REFEREE_LEAGUE_LINKS,
      stadiumTeamLinks: EXPECTED_STADIUM_TEAM_LINKS,
    });
    expect(summary.rawRows).toBeGreaterThan(summary.playerEditions);
    expect(progress.at(0)).toContain('Creating schema');
    expect(progress.at(-1)).toContain('completed');
  }, 120_000);

  it('reports a failed import phase for an incomplete source directory', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-incomplete-'));
    directories.push(directory);
    const progress: string[] = [];

    expect(() =>
      buildDatabase({
        examplesPath: directory,
        outputPath: join(directory, 'qdb.sqlite'),
        verifyExpectedCounts: false,
        progress: (message) => progress.push(message),
      }),
    ).toThrow();
    expect(progress.some((message) => message.includes('failed after'))).toBe(true);
  });
});
