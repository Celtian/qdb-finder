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
import type { FifaDatabase, FifaRow, FifaXmlFieldType } from 'fifa-t3db' with {
  'resolution-mode': 'import',
};
import { Datatype, Fifa, fifaTableConfig, Table, type Field } from 'fifatables';
import {
  buildDatabase,
  collectNationalityCodes,
  decodeFifaText,
  normalizeGender,
  parseTsvLine,
  readTable,
  resolveNationalityCode,
  sourceSnapshotDate,
  FIFAS,
  fifaForVersion,
  ImportSourceValidationError,
  inspectSourceHeaders,
  inspectT3dbDatabase,
  validateSourceData,
  validateTableData,
} from './importer';

const xmlType = (field: Field): FifaXmlFieldType =>
  field.type === Datatype.String
    ? 'DBOFIELDTYPE_STRING'
    : field.type === Datatype.Float
      ? 'DBOFIELDTYPE_REAL'
      : 'DBOFIELDTYPE_INTEGER';

interface MockT3dbTable {
  name: string;
  shortName: string;
  fields: {
    name: string;
    shortName: string;
    type: FifaXmlFieldType;
    depth: number;
    rangeLow: number;
    rangeHigh: number;
    nullable: boolean;
    key: boolean;
    updatable: boolean;
  }[];
}

const mockT3db = (
  fifa: Fifa,
  rows: Partial<Record<string, readonly FifaRow[]>> = {},
  customize?: (tables: MockT3dbTable[]) => void,
): FifaDatabase => {
  const tables: MockT3dbTable[] = Object.values(Table)
    .map((table) => ({
      name: table,
      shortName: table.slice(0, 4),
      fields: fifaTableConfig(fifa, table).map((field) => ({
        name: field.name,
        shortName: field.name.slice(0, 4),
        type: xmlType(field),
        depth: 32,
        rangeLow: field.range?.min ?? 0,
        rangeHigh: field.range?.max ?? 0,
        nullable: false,
        key: field.unique ?? false,
        updatable: true,
      })),
    }))
    .filter(({ fields }) => fields.length > 0);
  tables.push({
    name: 'version',
    shortName: 'vers',
    fields: [
      {
        name: 'exportdate',
        shortName: 'date',
        type: 'DBOFIELDTYPE_DATE',
        depth: 32,
        rangeLow: 0,
        rangeHigh: 999_999,
        nullable: false,
        key: false,
        updatable: false,
      },
    ],
  });
  customize?.(tables);
  return {
    header: {} as FifaDatabase['header'],
    schema: {
      name: 'fifa_ng_db',
      shortName: 'g_db',
      version: 6,
      tables,
      indices: [],
    },
    listTables: () => [],
    readTable: (name) => ({
      info: {} as ReturnType<FifaDatabase['readTable']>['info'],
      rows: rows[name] ?? [],
    }),
  };
};

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

  it('reports invalid numbers, unsafe integers, advisory ranges and numeric duplicates', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-row-validation-'));
    directories.push(directory);
    const path = join(directory, 'players.txt');
    const fields: Field[] = [
      {
        name: 'playerid',
        order: 0,
        type: Datatype.Int,
        default: 1,
        range: { min: 1, max: 100 },
        unique: true,
      },
      { name: 'rating', order: 1, type: Datatype.Float, default: 0, range: { min: 0, max: 99 } },
    ];
    writeFileSync(
      path,
      Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from(
          'playerid\trating\r\n1\t81,5\r\n01\t120\r\nnope\t80\r\n9007199254740992\t80',
          'utf16le',
        ),
      ]),
    );

    const report = validateTableData(path, Table.Players, fields);

    expect(report.valid).toBe(false);
    expect(report.errorCount).toBe(4);
    expect(report.warningCount).toBe(1);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'duplicate-value',
          field: 'playerid',
          count: 2,
          samples: [
            { line: 2, value: '1' },
            { line: 3, value: '01' },
          ],
        }),
        expect.objectContaining({ code: 'invalid-number', field: 'playerid' }),
        expect.objectContaining({ code: 'unsafe-integer', field: 'playerid' }),
        expect.objectContaining({ code: 'out-of-range', field: 'rating' }),
      ]),
    );
  });

  it('reports malformed quoted rows with their real file line', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-malformed-row-'));
    directories.push(directory);
    const path = join(directory, 'players.txt');
    const fields: Field[] = [
      { name: 'playerid', order: 0, type: Datatype.Int, default: 1, unique: true },
      { name: 'name', order: 1, type: Datatype.String, default: '' },
    ];
    writeFileSync(
      path,
      Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from('playerid\tname\r\n1\t"Unclosed', 'utf16le'),
      ]),
    );

    const report = validateTableData(path, Table.Players, fields);

    expect(report).toMatchObject({ valid: false, errorCount: 1 });
    expect(report.issues[0]).toMatchObject({
      code: 'malformed-row',
      samples: [{ line: 2 }],
    });
  });

  it('caps displayed issue groups while retaining totals', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-validation-cap-'));
    directories.push(directory);
    const path = join(directory, 'players.txt');
    const fields: Field[] = [
      { name: 'playerid', order: 0, type: Datatype.Int, default: 1, unique: true },
    ];
    const values = Array.from({ length: 101 }, (_, index) => `${index + 1}\r\n${index + 1}`).join(
      '\r\n',
    );
    writeFileSync(
      path,
      Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(`playerid\r\n${values}`, 'utf16le')]),
    );

    const report = validateTableData(path, Table.Players, fields);

    expect(report.errorCount).toBe(202);
    expect(report.issues).toHaveLength(100);
    expect(report.omittedIssueGroups).toBe(1);
  });

  it('reports duplicate referee identifiers with both source lines', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-referee-duplicate-'));
    directories.push(directory);
    const path = join(directory, 'referee.txt');
    const fields: Field[] = [
      {
        name: 'refereeid',
        order: 0,
        type: Datatype.Int,
        default: 1,
        range: { min: 1, max: 512 },
        unique: true,
      },
    ];
    const refereeIds = [...Array.from({ length: 56 }, (_, index) => index + 1), 56];
    writeFileSync(
      path,
      Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from(`refereeid\r\n${refereeIds.join('\r\n')}`, 'utf16le'),
      ]),
    );
    const report = validateTableData(path, Table.Referee, fields);

    expect(report).toMatchObject({ valid: false, errorCount: 2 });
    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: 'duplicate-value',
        file: 'referee.txt',
        field: 'refereeid',
        count: 2,
        samples: [
          { line: 57, value: '56' },
          { line: 58, value: '56' },
        ],
      }),
    );
    expect(JSON.stringify(report)).not.toContain('UNIQUE constraint failed');
  });

  it('accepts a representative bundled edition while retaining advisory metadata warnings', () => {
    const fifa = Fifa.Fifa23;
    const report = validateSourceData({
      fifa,
      path: join(process.cwd(), 'examples', fifa),
    });

    expect(report).toMatchObject({ valid: true, errorCount: 0 });
    expect(report.warningCount).toBeGreaterThan(0);
  }, 30_000);

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

  it('builds a named multi-edition custom database with the shared schema', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-custom-'));
    directories.push(directory);
    const path = join(directory, 'custom.sqlite');
    const progress: string[] = [];

    const summary = buildDatabase({
      sources: [
        { fifa: fifaForVersion(16), path: join(process.cwd(), 'examples', 'fifa16') },
        { fifa: fifaForVersion(23), path: join(process.cwd(), 'examples', 'fifa23') },
      ],
      outputPath: path,
      databaseId: '11111111-1111-4111-8111-111111111111',
      databaseName: 'My FIFA 16 and 23',
      databaseKind: 'custom',
      verifyExpectedCounts: false,
      progress: (message) => progress.push(message),
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
    expect(database.prepare('PRAGMA user_version').get()?.['user_version']).toBe(3);
    expect(metadata).toMatchObject({
      database_name: 'My FIFA 16 and 23',
      database_kind: 'custom',
      versions: '16,23',
    });
    expect(summary.playerEditions).toBeGreaterThan(1_000);
    expect(summary.rawRows).toBeGreaterThan(summary.playerEditions);
    expect(progress.at(0)).toContain('Validating source folders');
    expect(progress.at(-1)).toContain('completed');
    expect(
      database
        .prepare("SELECT count(*) AS count FROM player_search WHERE player_search MATCH 'messi'")
        .get()?.['count'],
    ).toBeGreaterThan(0);
    expect(
      database
        .prepare(
          `SELECT is_national, country_id, country_name, country_code
           FROM team_edition WHERE version = 23 AND team_id = 1330`,
        )
        .get(),
    ).toEqual({
      is_national: 1,
      country_id: 12,
      country_name: 'Czech Republic',
      country_code: 'cz',
    });
    expect(
      database
        .prepare(
          `SELECT is_national, country_id, country_name, country_code
           FROM team_edition WHERE version = 23 AND team_id = 1`,
        )
        .get(),
    ).toEqual({
      is_national: 0,
      country_id: 14,
      country_name: 'England',
      country_code: 'gb-eng',
    });
    expect(
      database
        .prepare(
          `SELECT is_national, country_id, country_name, country_code
           FROM team_edition WHERE version = 23 AND team_id = 110984`,
        )
        .get(),
    ).toEqual({
      is_national: 0,
      country_id: 57,
      country_name: 'Ecuador',
      country_code: 'ec',
    });
    expect(
      database
        .prepare(
          `SELECT is_national, country_id, country_name, country_code
           FROM team_edition WHERE version = 16 AND team_id = 1629`,
        )
        .get(),
    ).toEqual({
      is_national: 0,
      country_id: 54,
      country_name: 'Brazil',
      country_code: 'br',
    });
    expect(
      database
        .prepare(
          `SELECT is_national, country_id, country_name, country_code
           FROM team_edition WHERE version = 16 AND team_id = 1960`,
        )
        .get(),
    ).toEqual({
      is_national: 0,
      country_id: 50,
      country_name: 'Wales',
      country_code: 'gb-wls',
    });
    database.close();
  }, 60_000);

  it('resolves every player name field from dcplayernames when needed', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-dcplayernames-'));
    directories.push(directory);
    const path = join(directory, 'fifa22.sqlite');

    buildDatabase({
      sources: [{ fifa: Fifa.Fifa22, path: join(process.cwd(), 'examples', 'fifa22') }],
      outputPath: path,
      databaseName: 'FIFA 22 name lookup',
      databaseKind: 'custom',
      verifyExpectedCounts: false,
    });

    const database = new DatabaseSync(path, { readOnly: true });
    const player = database
      .prepare(
        `SELECT first_name, last_name, common_name, jersey_name
         FROM player_edition WHERE version = 22 AND player_id = 137809`,
      )
      .get();

    expect(player).toEqual({
      first_name: 'Vágner',
      last_name: 'Silva de Souza',
      common_name: 'Vágner Love',
      jersey_name: 'Vagner Love',
    });
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

  it('detects a t3db edition without depending on metadata field order', () => {
    const database = mockT3db(Fifa.Fifa16, {}, (tables) => {
      for (const table of tables) table.fields.reverse();
    });

    expect(inspectT3dbDatabase(database)).toMatchObject({
      detection: 'detected',
      detectedVersion: 16,
      matchingVersions: [16],
    });
  });

  it('allows extra t3db fields after a manual compatible edition selection', () => {
    const database = mockT3db(Fifa.Fifa16, {}, (tables) => {
      tables
        .find(({ name }) => name === Table.Players)
        ?.fields.push({
          name: 'moddedfield',
          shortName: 'modf',
          type: 'DBOFIELDTYPE_INTEGER',
          depth: 1,
          rangeLow: 0,
          rangeHigh: 1,
          nullable: false,
          key: false,
          updatable: true,
        });
    });

    expect(inspectT3dbDatabase(database)).toMatchObject({ detection: 'unknown' });
    expect(inspectT3dbDatabase(database, 16).issue).toBeUndefined();
  });

  it('rejects missing and mistyped required t3db fields', () => {
    const database = mockT3db(Fifa.Fifa16, {}, (tables) => {
      const players = tables.find(({ name }) => name === Table.Players);
      const playerId = players?.fields.find(({ name }) => name === 'playerid');
      if (playerId) playerId.type = 'DBOFIELDTYPE_STRING';
      const teams = tables.find(({ name }) => name === Table.Teams);
      if (teams) teams.fields = teams.fields.filter(({ name }) => name !== 'teamid');
    });

    const inspection = inspectT3dbDatabase(database, 16);

    expect(inspection.issue).toMatchObject({ code: 'header-mismatch' });
    expect(inspection.diagnostics).toEqual(
      expect.arrayContaining([
        'players.playerid has an incompatible type',
        'teams.teamid is missing',
      ]),
    );
  });

  it('reports decoded t3db duplicates by record number', () => {
    const playerFields = fifaTableConfig(Fifa.Fifa16, Table.Players);
    const row = Object.fromEntries(
      playerFields.map((field) => [field.name, field.name === 'playerid' ? 1 : field.default]),
    );
    const database = mockT3db(Fifa.Fifa16, {
      [Table.Players]: [row, row],
    });

    const report = validateSourceData({
      kind: 't3db',
      fifa: Fifa.Fifa16,
      databasePath: '/game/fifa_ng_db.db',
      metadataPath: '/game/fifa_ng_db-meta.xml',
      database,
    });

    expect(report.valid).toBe(false);
    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: 'duplicate-value',
        file: 'players table',
        field: 'playerid',
        samples: [
          { record: 1, value: '1' },
          { record: 2, value: '1' },
        ],
      }),
    );
  });

  it('extracts the snapshot date from the decoded t3db version table', () => {
    const database = mockT3db(Fifa.Fifa16, {
      version: [{ exportdate: 160_000 }],
    });

    expect(
      sourceSnapshotDate({
        kind: 't3db',
        fifa: Fifa.Fifa16,
        databasePath: '/game/fifa_ng_db.db',
        metadataPath: '/game/fifa_ng_db-meta.xml',
        database,
      }),
    ).toBe('2020-11-06');
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
