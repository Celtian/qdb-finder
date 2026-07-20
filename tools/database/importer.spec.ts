import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
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
  FIFAS,
  fifaForVersion,
  ImportSourceValidationError,
  inspectSourceHeaders,
} from './importer';

describe('FIFA text importer', () => {
  const directories: string[] = [];
  const fifa23HeaderFiles = [
    'players.txt',
    'playernames.txt',
    'nations.txt',
    'teams.txt',
    'leagues.txt',
    'referee.txt',
    'stadiums.txt',
    'leagueteamlinks.txt',
    'teamplayerlinks.txt',
    'teamstadiumlinks.txt',
    'leaguerefereelinks.txt',
    'version.txt',
    'competition.txt',
  ];
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
      sources: FIFAS.map((fifa) => ({ fifa, path: join(process.cwd(), 'examples', fifa) })),
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
    expect(progress.at(0)).toContain('Validating source folders');
    expect(progress.at(-1)).toContain('completed');
  }, 120_000);

  it('reports a failed import phase for an incomplete source directory', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-incomplete-'));
    directories.push(directory);
    const progress: string[] = [];

    expect(() =>
      buildDatabase({
        sources: [{ fifa: FIFAS[0], path: directory }],
        outputPath: join(directory, 'qdb.sqlite'),
        verifyExpectedCounts: false,
        progress: (message) => progress.push(message),
      }),
    ).toThrow();
    expect(progress.some((message) => message.includes('failed after'))).toBe(true);
  });

  it('builds a named single-edition custom database with the shared schema', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-custom-'));
    directories.push(directory);
    const path = join(directory, 'custom.sqlite');

    const summary = buildDatabase({
      sources: [{ fifa: fifaForVersion(23), path: join(process.cwd(), 'examples', 'fifa23') }],
      outputPath: path,
      databaseId: '11111111-1111-4111-8111-111111111111',
      databaseName: 'My FIFA 23',
      databaseKind: 'custom',
      verifyExpectedCounts: false,
    });

    const database = new DatabaseSync(path, { readOnly: true });
    const metadata = Object.fromEntries(
      (
        database.prepare('SELECT key, value FROM metadata').all() as {
          key: string;
          value: string;
        }[]
      ).map(({ key, value }) => [key, value]),
    );
    expect(database.prepare('PRAGMA user_version').get()?.['user_version']).toBe(1);
    expect(metadata).toMatchObject({
      database_name: 'My FIFA 23',
      database_kind: 'custom',
      versions: '23',
    });
    expect(summary.playerEditions).toBeGreaterThan(1_000);
    expect(
      database
        .prepare("SELECT count(*) AS count FROM player_search WHERE player_search MATCH 'messi'")
        .get()?.['count'],
    ).toBeGreaterThan(0);
    database.close();
  }, 60_000);

  it('rejects unsupported FIFA versions', () => {
    expect(() => fifaForVersion(24)).toThrow(/not supported/);
  });

  it.each(FIFAS)('detects the edition from required %s headers', (fifa) => {
    const inspection = inspectSourceHeaders(join(process.cwd(), 'examples', fifa));

    expect(inspection).toMatchObject({
      detection: 'detected',
      detectedVersion: Number(fifa.slice(4)),
      matchingVersions: [Number(fifa.slice(4))],
    });
  });

  it('returns a concise wrong-version issue without exposing headers or paths', () => {
    const inspection = inspectSourceHeaders(join(process.cwd(), 'examples', 'fifa16'), 23);

    expect(inspection.issue).toMatchObject({
      code: 'version-mismatch',
      message: 'This folder appears to be FIFA 16, but FIFA 23 is selected.',
      detectedVersion: 16,
    });
    expect(inspection.issue?.message).not.toContain(process.cwd());
    expect(inspection.issue?.message).not.toContain('Expected:');
    expect(inspection.diagnostics.join('\n')).toContain('Expected:');
  });

  it('reports all required files before creating database output', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-preflight-'));
    directories.push(directory);
    const outputPath = join(directory, 'should-not-exist.sqlite');

    expect(() =>
      buildDatabase({
        sources: [{ fifa: fifaForVersion(23), path: directory }],
        outputPath,
        verifyExpectedCounts: false,
      }),
    ).toThrow(ImportSourceValidationError);
    const inspection = inspectSourceHeaders(directory, 23);
    expect(inspection.issue).toMatchObject({ code: 'missing-files' });
    expect(inspection.issue?.files).toContain('players.txt');
    expect(inspection.detection).toBe('unknown');
    expect(existsSync(outputPath)).toBe(false);
  });

  it('reports an empty recognized table without exposing its raw header', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-empty-header-'));
    directories.push(directory);
    for (const file of fifa23HeaderFiles)
      copyFileSync(join(process.cwd(), 'examples', 'fifa23', file), join(directory, file));
    writeFileSync(join(directory, 'competition.txt'), Buffer.alloc(0));

    const inspection = inspectSourceHeaders(directory, 23);

    expect(inspection.issue).toMatchObject({
      code: 'invalid-source',
      files: ['competition.txt'],
    });
    expect(inspection.issue?.message).toBe(
      'Some table files are empty or unreadable: competition.txt.',
    );
  });

  it('reports reordered columns as a concise header mismatch', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-reordered-header-'));
    directories.push(directory);
    for (const file of fifa23HeaderFiles)
      copyFileSync(join(process.cwd(), 'examples', 'fifa23', file), join(directory, file));
    const competitionPath = join(directory, 'competition.txt');
    const [header] = decodeFifaText(readFileSync(competitionPath)).split(/\r?\n/);
    const columns = parseTsvLine(header);
    [columns[0], columns[1]] = [columns[1], columns[0]];
    writeFileSync(
      competitionPath,
      Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(columns.join('\t'), 'utf16le')]),
    );

    const inspection = inspectSourceHeaders(directory, 23);

    expect(inspection.issue).toMatchObject({
      code: 'header-mismatch',
      message: 'Some table headers do not match FIFA 23: competition.txt.',
      files: ['competition.txt'],
    });
    expect(inspection.issue?.message).not.toContain('Expected:');
  });
});
