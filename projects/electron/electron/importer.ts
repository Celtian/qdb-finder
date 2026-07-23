import {
  closeSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { FifaDatabase, FifaRow, FifaXmlFieldType } from 'fifa-t3db' with {
  'resolution-mode': 'import',
};
import { Attribute, CalculateUtils, Fifa as RatingFifa, Position } from 'fifarating';
import { registerFifaDatePrototype } from 'fifadate';
import { Datatype, Fifa, Table, fifaTableConfig, sortByOrder, type Field } from 'fifatables';
import type {
  DatabaseSourceValidationIssue,
  DatabaseSourceValidationIssueCode,
  DatabaseSourceValidationReport,
  DatabaseSourceValidationSample,
  DatabaseSourceValidationSeverity,
} from '../src/app/core/qdb-contracts';

declare global {
  interface DateConstructor {
    fromFifaDate(value: number): Date;
  }
}

registerFifaDatePrototype();

export const FIFAS = Object.values(Fifa);
export const SUPPORTED_FIFA_VERSIONS = FIFAS.map((fifa) => Number(fifa.slice(4))).sort(
  (left, right) => right - left,
);
export const DATABASE_SCHEMA_VERSION = 3;
export const TABLES = Object.values(Table);
export const EXPECTED_EDITIONS = 227_572;
export const EXPECTED_TEAM_LINKS = 241_640;
export const EXPECTED_TEAM_EDITIONS = 8_907;
export const EXPECTED_LEAGUE_EDITIONS = 560;
export const EXPECTED_REFEREE_EDITIONS = 2_516;
export const EXPECTED_STADIUM_EDITIONS = 1_371;
export const EXPECTED_REFEREE_LEAGUE_LINKS = 3_001;
export const EXPECTED_STADIUM_TEAM_LINKS = 8_890;
export const POSITION_IDS = Object.values(Position);
const NATIONAL_TEAM_LEAGUE_IDS = new Set([78, 2_136]);
const positionById = Object.fromEntries(POSITION_IDS.map((position, index) => [index, position]));

type RawRow = Record<string, string | number>;
type SqlRow = Record<string, string | number | null>;
type NationCodeValue = string | number | null | undefined;

export interface NationCodeRow {
  nationid?: NationCodeValue;
  isocountrycode?: NationCodeValue;
}

export interface TextImportSource {
  kind?: 'text-folder';
  fifa: Fifa;
  path: string;
}

export interface T3dbImportSource {
  kind: 't3db';
  fifa: Fifa;
  databasePath: string;
  metadataPath: string;
  database: FifaDatabase;
}

export type ImportSource = TextImportSource | T3dbImportSource;

export type ImportSourceIssueCode =
  'version-mismatch' | 'missing-files' | 'header-mismatch' | 'invalid-source';

export interface ImportSourceIssue {
  code: ImportSourceIssueCode;
  message: string;
  files: string[];
  detectedVersion?: number;
}

export interface SourceHeaderInspection {
  detection: 'detected' | 'ambiguous' | 'unknown';
  detectedVersion?: number;
  matchingVersions: number[];
  issue?: ImportSourceIssue;
  diagnostics: string[];
}

export class ImportSourceValidationError extends Error {
  constructor(
    readonly issue: ImportSourceIssue,
    readonly diagnostics: string[],
    readonly report?: DatabaseSourceValidationReport,
  ) {
    super(issue.message);
    this.name = 'ImportSourceValidationError';
  }
}

interface ValidationOccurrence {
  severity: DatabaseSourceValidationSeverity;
  code: DatabaseSourceValidationIssueCode;
  file: string;
  field?: string;
  message: string;
  group: string;
  samples: DatabaseSourceValidationSample[];
  count?: number;
}

interface MutableValidationIssue extends DatabaseSourceValidationIssue {
  key: string;
}

interface TableReadOptions {
  table: Table;
  accumulator: SourceValidationAccumulator;
  throwOnErrors?: boolean;
}

export interface ImportOptions {
  sources: ImportSource[];
  outputPath: string;
  databaseId?: string;
  databaseName?: string;
  databaseKind?: 'built-in' | 'custom';
  verifyExpectedCounts?: boolean;
  progress?: (message: string) => void;
}

export const fifaForVersion = (version: number): Fifa => {
  const fifa = FIFAS.find((candidate) => Number(candidate.slice(4)) === version);
  if (!fifa) throw new Error(`FIFA ${version} is not supported. Choose FIFA 11–23.`);
  return fifa;
};

export interface ImportSummary {
  sourceFiles: number;
  rawRows: number;
  playerEditions: number;
  teamLinks: number;
  teamEditions: number;
  leagueEditions: number;
  refereeEditions: number;
  stadiumEditions: number;
  refereeLeagueLinks: number;
  stadiumTeamLinks: number;
}

const runPhase = <T>(label: string, progress: ImportOptions['progress'], action: () => T): T => {
  progress?.(`[db:build] ${label}...`);
  const startedAt = Date.now();
  try {
    const result = action();
    progress?.(
      `[db:build] ${label} completed in ${((Date.now() - startedAt) / 1_000).toFixed(2)}s.`,
    );
    return result;
  } catch (error) {
    progress?.(
      `[db:build] ${label} failed after ${((Date.now() - startedAt) / 1_000).toFixed(2)}s.`,
    );
    throw error;
  }
};

const isT3dbSource = (source: ImportSource): source is T3dbImportSource => source.kind === 't3db';

const VALIDATION_SAMPLE_LIMIT = 5;
const VALIDATION_GROUP_LIMIT_PER_SEVERITY = 100;
const SAMPLE_VALUE_LIMIT = 120;
const canonicalIdentityFields = new Map<Table, string>([
  [Table.Players, 'playerid'],
  [Table.PlayerNames, 'nameid'],
  [Table.Nations, 'nationid'],
  [Table.Teams, 'teamid'],
  [Table.Leagues, 'leagueid'],
  [Table.Referee, 'refereeid'],
  [Table.Stadiums, 'stadiumid'],
]);

const sampleValue = (value: string): string =>
  value.length <= SAMPLE_VALUE_LIMIT ? value : `${value.slice(0, SAMPLE_VALUE_LIMIT - 1)}…`;

class SourceValidationAccumulator {
  private readonly issues = new Map<string, MutableValidationIssue>();
  private errors = 0;
  private warnings = 0;

  add(occurrence: ValidationOccurrence): void {
    const key = [
      occurrence.severity,
      occurrence.code,
      occurrence.file,
      occurrence.field ?? '',
      occurrence.group,
    ].join('\u0000');
    const increment = occurrence.count ?? 1;
    if (occurrence.severity === 'error') this.errors += increment;
    else this.warnings += increment;
    const current = this.issues.get(key);
    if (current) {
      current.count += increment;
      for (const sample of occurrence.samples)
        if (
          current.samples.length < VALIDATION_SAMPLE_LIMIT &&
          !current.samples.some(
            (candidate) =>
              candidate.line === sample.line &&
              candidate.record === sample.record &&
              candidate.value === sample.value,
          )
        )
          current.samples.push(sample);
      return;
    }
    this.issues.set(key, {
      key,
      severity: occurrence.severity,
      code: occurrence.code,
      file: occurrence.file,
      field: occurrence.field,
      message: occurrence.message,
      count: increment,
      samples: occurrence.samples.slice(0, VALIDATION_SAMPLE_LIMIT),
    });
  }

  get errorCount(): number {
    return this.errors;
  }

  report(): DatabaseSourceValidationReport {
    const all = [...this.issues.values()];
    const visible = (severity: DatabaseSourceValidationSeverity): MutableValidationIssue[] =>
      all
        .filter((issue) => issue.severity === severity)
        .slice(0, VALIDATION_GROUP_LIMIT_PER_SEVERITY);
    const selected = [...visible('error'), ...visible('warning')];
    return {
      valid: this.errors === 0,
      errorCount: this.errors,
      warningCount: this.warnings,
      issues: selected.map((issue) => ({
        severity: issue.severity,
        code: issue.code,
        file: issue.file,
        field: issue.field,
        message: issue.message,
        count: issue.count,
        samples: issue.samples,
      })),
      omittedIssueGroups: all.length - selected.length,
    };
  }
}

export const decodeFifaText = (buffer: Buffer): string => {
  if (buffer.length % 2 !== 0) throw new Error('UTF-16LE file has an incomplete code unit.');
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe)
    return buffer.subarray(2).toString('utf16le');
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff)
    throw new Error('UTF-16BE files are not supported.');
  return buffer.toString('utf16le').replace(/^\uFEFF/, '');
};

export const parseTsvLine = (line: string): string[] => {
  const result: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === '\t' && !quoted) {
      result.push(value);
      value = '';
    } else value += character;
  }
  if (quoted) throw new Error('Unclosed quoted field.');
  result.push(value);
  return result;
};

const numericValue = (
  field: Field,
  raw: string,
): { value?: number; code?: 'invalid-number' | 'unsafe-integer' } => {
  const normalized = field.type === Datatype.Float ? raw.replace(',', '.') : raw;
  const syntax =
    field.type === Datatype.Int
      ? /^[+-]?\d+$/.test(normalized)
      : /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized);
  if (!syntax) return { code: 'invalid-number' };
  const value = Number(normalized);
  if (!Number.isFinite(value)) return { code: 'invalid-number' };
  if (field.type === Datatype.Int && !Number.isSafeInteger(value))
    return { code: 'unsafe-integer' };
  return { value };
};

const validationError = (
  file: string,
  accumulator: SourceValidationAccumulator,
): ImportSourceValidationError => {
  const report = accumulator.report();
  return new ImportSourceValidationError(
    {
      code: 'invalid-source',
      message: 'Source data is corrupted and cannot be imported.',
      files: [file],
    },
    report.issues.map(
      (issue) =>
        `${issue.file}${issue.field ? `:${issue.field}` : ''}: ${issue.message} (${issue.count})`,
    ),
    report,
  );
};

const addMalformedFileIssue = (
  accumulator: SourceValidationAccumulator,
  file: string,
  message: string,
  line = 1,
): void =>
  accumulator.add({
    severity: 'error',
    code: 'malformed-row',
    file,
    message,
    group: message,
    samples: [{ line }],
  });

export const readTable = (path: string, fields: Field[], options?: TableReadOptions): RawRow[] => {
  const lines = decodeFifaText(readFileSync(path)).split(/\r?\n/);
  while (lines.at(-1) === '') lines.pop();
  if (!lines.length) return [];
  const ordered = [...fields].sort(sortByOrder);
  let header: string[];
  try {
    header = parseTsvLine(lines[0]);
  } catch (error) {
    if (!options) throw error;
    addMalformedFileIssue(
      options.accumulator,
      `${options.table}.txt`,
      error instanceof Error ? error.message : 'The table header is malformed.',
    );
    if (options.throwOnErrors) throw validationError(`${options.table}.txt`, options.accumulator);
    return [];
  }
  const expected = ordered.map((field) => field.name);
  if (header.length !== expected.length || header.some((name, index) => name !== expected[index])) {
    if (options) {
      addMalformedFileIssue(
        options.accumulator,
        `${options.table}.txt`,
        'The table header is invalid.',
      );
      if (options.throwOnErrors) throw validationError(`${options.table}.txt`, options.accumulator);
      return [];
    }
    throw new Error(
      `Header mismatch in ${path}.\nExpected: ${expected.join('\t')}\nActual: ${header.join('\t')}`,
    );
  }
  const seen = new Map<string, Map<string, { line: number; value: string; reported: boolean }>>(
    ordered.filter((field) => field.unique).map((field) => [field.name, new Map()]),
  );
  const rows: RawRow[] = [];
  for (const [rowIndex, line] of lines.slice(1).entries()) {
    const lineNumber = rowIndex + 2;
    let values: string[];
    try {
      values = parseTsvLine(line);
    } catch (error) {
      if (!options) throw error;
      addMalformedFileIssue(
        options.accumulator,
        `${options.table}.txt`,
        error instanceof Error ? error.message : 'The row is malformed.',
        lineNumber,
      );
      continue;
    }
    if (values.length !== ordered.length) {
      if (!options) throw new Error(`Column mismatch in ${path} at data row ${rowIndex + 1}.`);
      addMalformedFileIssue(
        options.accumulator,
        `${options.table}.txt`,
        `Expected ${ordered.length} columns but found ${values.length}.`,
        lineNumber,
      );
      continue;
    }
    let valid = true;
    const entries: [string, string | number][] = [];
    for (const [index, field] of ordered.entries()) {
      const raw = values[index];
      let formatted: string | number = raw;
      if (field.type !== Datatype.String) {
        const numeric = numericValue(field, raw);
        if (numeric.code) {
          valid = false;
          if (!options)
            throw new Error(
              `Invalid ${field.type === Datatype.Int ? 'integer' : 'number'} in ${path} at data row ${rowIndex + 1}, field ${field.name}.`,
            );
          options.accumulator.add({
            severity: 'error',
            code: numeric.code,
            file: `${options.table}.txt`,
            field: field.name,
            message:
              numeric.code === 'unsafe-integer'
                ? 'Integer cannot be represented safely.'
                : `Expected a valid ${field.type === Datatype.Int ? 'integer' : 'number'}.`,
            group: numeric.code,
            samples: [{ line: lineNumber, value: sampleValue(raw) }],
          });
          continue;
        }
        formatted = numeric.value as number;
        if (options && field.range && (formatted < field.range.min || formatted > field.range.max))
          options.accumulator.add({
            severity: 'warning',
            code: 'out-of-range',
            file: `${options.table}.txt`,
            field: field.name,
            message: `Value is outside the published range ${field.range.min}–${field.range.max}.`,
            group: `${field.range.min}:${field.range.max}`,
            samples: [{ line: lineNumber, value: sampleValue(raw) }],
          });
      }
      entries.push([field.name, formatted]);
      if (options && field.unique) {
        const key = String(formatted);
        const valuesSeen = seen.get(field.name) as Map<
          string,
          { line: number; value: string; reported: boolean }
        >;
        const previous = valuesSeen.get(key);
        if (!previous) valuesSeen.set(key, { line: lineNumber, value: raw, reported: false });
        else {
          const critical = canonicalIdentityFields.get(options.table) === field.name;
          options.accumulator.add({
            severity: critical ? 'error' : 'warning',
            code: 'duplicate-value',
            file: `${options.table}.txt`,
            field: field.name,
            message: critical
              ? `Canonical identifier ${sampleValue(key)} occurs more than once.`
              : `Value ${sampleValue(key)} occurs more than once in a field declared unique.`,
            group: key,
            count: previous.reported ? 1 : 2,
            samples: [
              ...(previous.reported
                ? []
                : [{ line: previous.line, value: sampleValue(previous.value) }]),
              { line: lineNumber, value: sampleValue(raw) },
            ],
          });
          previous.reported = true;
        }
      }
    }
    if (valid) rows.push(Object.fromEntries(entries));
  }
  if (options?.throwOnErrors && options.accumulator.errorCount)
    throw validationError(`${options.table}.txt`, options.accumulator);
  return rows;
};

const tableIssueFile = (table: Table, t3db: boolean): string =>
  t3db ? `${table} table` : `${table}.txt`;

const readT3dbTable = (
  database: FifaDatabase,
  table: Table,
  fields: Field[],
  accumulator: SourceValidationAccumulator,
  throwOnErrors = false,
): RawRow[] => {
  const file = tableIssueFile(table, true);
  let sourceRows: readonly FifaRow[];
  try {
    sourceRows = database.readTable(table).rows;
  } catch (error) {
    addMalformedFileIssue(
      accumulator,
      file,
      error instanceof Error ? error.message : 'The t3db table could not be read.',
    );
    if (throwOnErrors) throw validationError(file, accumulator);
    return [];
  }
  const seen = new Map<string, Map<string, { record: number; value: string; reported: boolean }>>(
    fields.filter((field) => field.unique).map((field) => [field.name, new Map()]),
  );
  const rows: RawRow[] = [];
  for (const [rowIndex, sourceRow] of sourceRows.entries()) {
    const record = rowIndex + 1;
    let valid = true;
    const entries: [string, string | number][] = [];
    for (const field of fields) {
      const value = sourceRow[field.name];
      if (value === undefined) {
        valid = false;
        accumulator.add({
          severity: 'error',
          code: 'malformed-row',
          file,
          field: field.name,
          message: 'The required field is missing from this record.',
          group: 'missing-field',
          samples: [{ record }],
        });
        continue;
      }
      if (
        (field.type === Datatype.String && typeof value !== 'string') ||
        (field.type !== Datatype.String &&
          (typeof value !== 'number' ||
            !Number.isFinite(value) ||
            (field.type === Datatype.Int && !Number.isSafeInteger(value))))
      ) {
        valid = false;
        accumulator.add({
          severity: 'error',
          code:
            field.type === Datatype.Int && typeof value === 'number' && !Number.isSafeInteger(value)
              ? 'unsafe-integer'
              : 'invalid-number',
          file,
          field: field.name,
          message:
            field.type === Datatype.String
              ? 'Expected a string value.'
              : `Expected a valid ${field.type === Datatype.Int ? 'integer' : 'number'}.`,
          group: 'invalid-value',
          samples: [{ record, value: sampleValue(String(value)) }],
        });
        continue;
      }
      entries.push([field.name, value]);
      if (
        typeof value === 'number' &&
        field.range &&
        (value < field.range.min || value > field.range.max)
      )
        accumulator.add({
          severity: 'warning',
          code: 'out-of-range',
          file,
          field: field.name,
          message: `Value is outside the published range ${field.range.min}–${field.range.max}.`,
          group: `${field.range.min}:${field.range.max}`,
          samples: [{ record, value: sampleValue(String(value)) }],
        });
      if (field.unique) {
        const key = String(value);
        const valuesSeen = seen.get(field.name) as Map<
          string,
          { record: number; value: string; reported: boolean }
        >;
        const previous = valuesSeen.get(key);
        if (!previous) valuesSeen.set(key, { record, value: String(value), reported: false });
        else {
          const critical = canonicalIdentityFields.get(table) === field.name;
          accumulator.add({
            severity: critical ? 'error' : 'warning',
            code: 'duplicate-value',
            file,
            field: field.name,
            message: critical
              ? `Canonical identifier ${sampleValue(key)} occurs more than once.`
              : `Value ${sampleValue(key)} occurs more than once in a field declared unique.`,
            group: key,
            count: previous.reported ? 1 : 2,
            samples: [
              ...(previous.reported
                ? []
                : [{ record: previous.record, value: sampleValue(previous.value) }]),
              { record, value: sampleValue(String(value)) },
            ],
          });
          previous.reported = true;
        }
      }
    }
    if (valid) rows.push(Object.fromEntries(entries));
  }
  if (throwOnErrors && accumulator.errorCount) throw validationError(file, accumulator);
  return rows;
};

export const validateTableData = (
  path: string,
  table: Table,
  fields: Field[],
): DatabaseSourceValidationReport => {
  const accumulator = new SourceValidationAccumulator();
  try {
    readTable(path, fields, { table, accumulator });
  } catch (error) {
    addMalformedFileIssue(
      accumulator,
      `${table}.txt`,
      error instanceof Error ? error.message : 'The table could not be read.',
    );
  }
  return accumulator.report();
};

const quote = (value: string): string => `"${value.replaceAll('"', '""')}"`;
const normalize = (value: string): string =>
  value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('en').trim();
const asNumber = (value: string | number | null | undefined, fallback = 0): number =>
  Number(value ?? fallback);
const asText = (value: string | number | null | undefined): string => String(value ?? '').trim();
const optionalNumber = (value: string | number | null | undefined): number | null =>
  value === undefined || value === null ? null : Number(value);
const optionalPositiveNumber = (value: string | number | null | undefined): number | null => {
  const number = optionalNumber(value);
  return number && number > 0 ? number : null;
};

export const normalizeGender = (value: string | number | null | undefined): 0 | 1 =>
  asNumber(value) === 1 ? 1 : 0;

const nationalityCodeOverrides = new Map<number, string>([
  [14, 'gb-eng'],
  [35, 'gb-nir'],
  [42, 'gb-sct'],
  [50, 'gb-wls'],
  [219, 'xk'],
]);

const staticNationalityCodes = new Map<number, string>(
  Object.entries({
    1: 'al',
    2: 'ad',
    3: 'am',
    4: 'at',
    5: 'az',
    6: 'by',
    7: 'be',
    8: 'ba',
    9: 'bg',
    10: 'hr',
    11: 'cy',
    12: 'cz',
    13: 'dk',
    14: 'gb-eng',
    15: 'me',
    16: 'fo',
    17: 'fi',
    18: 'fr',
    19: 'mk',
    20: 'ge',
    21: 'de',
    22: 'gr',
    23: 'hu',
    24: 'is',
    25: 'ie',
    26: 'il',
    27: 'it',
    28: 'lv',
    29: 'li',
    30: 'lt',
    31: 'lu',
    32: 'mt',
    33: 'md',
    34: 'nl',
    35: 'gb-nir',
    36: 'no',
    37: 'pl',
    38: 'pt',
    39: 'ro',
    40: 'ru',
    41: 'sm',
    42: 'gb-sct',
    43: 'sk',
    44: 'si',
    45: 'es',
    46: 'se',
    47: 'ch',
    48: 'tr',
    49: 'ua',
    50: 'gb-wls',
    51: 'rs',
    52: 'ar',
    53: 'bo',
    54: 'br',
    55: 'cl',
    56: 'co',
    57: 'ec',
    58: 'py',
    59: 'pe',
    60: 'uy',
    61: 've',
    62: 'ai',
    63: 'ag',
    64: 'aw',
    66: 'bb',
    67: 'bz',
    68: 'bm',
    70: 'ca',
    72: 'cr',
    73: 'cu',
    74: 'dm',
    76: 'sv',
    77: 'gd',
    78: 'gt',
    79: 'gy',
    80: 'ht',
    81: 'hn',
    82: 'jm',
    83: 'mx',
    84: 'ms',
    85: 'an',
    86: 'ni',
    87: 'pa',
    88: 'pr',
    89: 'kn',
    90: 'lc',
    91: 'vc',
    92: 'sr',
    93: 'tt',
    94: 'tc',
    95: 'us',
    96: 'vi',
    97: 'dz',
    98: 'ao',
    99: 'bj',
    100: 'bw',
    101: 'bf',
    102: 'bi',
    103: 'cm',
    104: 'cv',
    105: 'cf',
    106: 'td',
    107: 'cg',
    108: 'ci',
    110: 'cd',
    111: 'eg',
    112: 'gq',
    113: 'er',
    114: 'et',
    115: 'ga',
    116: 'gm',
    117: 'gh',
    118: 'gn',
    119: 'gw',
    120: 'ke',
    122: 'lr',
    123: 'ly',
    124: 'mg',
    125: 'mw',
    126: 'ml',
    127: 'mr',
    128: 'mu',
    129: 'ma',
    130: 'mz',
    131: 'na',
    132: 'ne',
    133: 'ng',
    134: 'rw',
    135: 'st',
    136: 'sn',
    137: 'sc',
    138: 'sl',
    139: 'so',
    140: 'za',
    141: 'sd',
    142: 'sz',
    143: 'tz',
    144: 'tg',
    145: 'tn',
    146: 'ug',
    147: 'zm',
    148: 'zw',
    149: 'af',
    150: 'bh',
    151: 'bd',
    152: 'bt',
    153: 'bn',
    154: 'kh',
    155: 'cn',
    157: 'gu',
    158: 'hk',
    159: 'in',
    160: 'id',
    161: 'ir',
    162: 'iq',
    163: 'jp',
    164: 'jo',
    165: 'kz',
    166: 'kp',
    167: 'kr',
    168: 'kw',
    169: 'kg',
    170: 'la',
    171: 'lb',
    172: 'mo',
    173: 'my',
    174: 'mv',
    175: 'mn',
    176: 'mm',
    177: 'np',
    178: 'om',
    179: 'pk',
    180: 'ps',
    181: 'ph',
    182: 'qa',
    183: 'sa',
    184: 'sg',
    185: 'lk',
    186: 'sy',
    187: 'tj',
    188: 'th',
    189: 'tm',
    190: 'ae',
    191: 'uz',
    192: 'vn',
    193: 'ye',
    195: 'au',
    196: 'ck',
    197: 'fj',
    198: 'nz',
    199: 'pg',
    201: 'sb',
    203: 'to',
    205: 'gi',
    207: 'do',
    208: 'ee',
    212: 'tl',
    213: 'tw',
    214: 'km',
    215: 'nc',
    218: 'ss',
    219: 'xk',
  }).map(([id, code]) => [Number(id), code]),
);

export const collectNationalityCodes = (
  rows: readonly NationCodeRow[],
): ReadonlyMap<number, string> => {
  const codes = new Map<number, string>();
  for (const row of rows) {
    const nationId = asNumber(row.nationid);
    const code = asText(row.isocountrycode).toLocaleLowerCase('en');
    if (nationId !== 0 && code) codes.set(nationId, code);
  }
  return codes;
};

export const resolveNationalityCode = (
  nationId: number,
  sourceCode: NationCodeValue,
  fallbackCodes: ReadonlyMap<number, string>,
): string => {
  if (nationId === 0) return '';
  const override = nationalityCodeOverrides.get(nationId);
  if (override) return override;
  const normalizedSource = asText(sourceCode).toLocaleLowerCase('en');
  return (
    normalizedSource || fallbackCodes.get(nationId) || staticNationalityCodes.get(nationId) || ''
  );
};
const isoDate = (value: string | number): string | null => {
  if (!Number(value)) return null;
  const date = Date.fromFifaDate(Number(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};
const ageAt = (birth: string | null, snapshot: string): number | null => {
  if (!birth) return null;
  const born = new Date(`${birth}T00:00:00Z`);
  const at = new Date(`${snapshot}T00:00:00Z`);
  let age = at.getUTCFullYear() - born.getUTCFullYear();
  if (
    at.getUTCMonth() < born.getUTCMonth() ||
    (at.getUTCMonth() === born.getUTCMonth() && at.getUTCDate() < born.getUTCDate())
  )
    age -= 1;
  return age;
};

const createSchema = (db: DatabaseSync): void =>
  db.exec(`
  PRAGMA user_version = ${DATABASE_SCHEMA_VERSION};
  PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON;
  CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE import_source (version INTEGER NOT NULL, table_name TEXT NOT NULL, source_file TEXT NOT NULL,
    row_count INTEGER NOT NULL, bytes INTEGER NOT NULL, PRIMARY KEY(version, table_name));
  CREATE TABLE import_missing (version INTEGER NOT NULL, table_name TEXT NOT NULL, reason TEXT NOT NULL,
    PRIMARY KEY(version, table_name));
  CREATE TABLE player_edition (
    key TEXT PRIMARY KEY, version INTEGER NOT NULL, player_id INTEGER NOT NULL,
    display_name TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
    common_name TEXT NOT NULL, jersey_name TEXT NOT NULL, aliases TEXT NOT NULL,
    nationality_id INTEGER NOT NULL, nationality_code TEXT NOT NULL,
    nationality_key TEXT NOT NULL, nationality_name TEXT NOT NULL, birth_date TEXT, snapshot_date TEXT NOT NULL,
    age INTEGER, gender INTEGER NOT NULL CHECK (gender IN (0, 1)), positions TEXT NOT NULL,
    overall INTEGER NOT NULL, potential INTEGER NOT NULL,
    best_position TEXT NOT NULL, best_rating INTEGER NOT NULL, height INTEGER, weight INTEGER,
    preferred_foot TEXT NOT NULL, attacking_work_rate TEXT NOT NULL, defensive_work_rate TEXT NOT NULL,
    attributes_json TEXT NOT NULL, ratings_json TEXT NOT NULL, raw_json TEXT NOT NULL,
    UNIQUE(version, player_id)
  );
  CREATE TABLE player_team (
    player_key TEXT NOT NULL REFERENCES player_edition(key) ON DELETE CASCADE, version INTEGER NOT NULL,
    player_id INTEGER NOT NULL, team_id INTEGER NOT NULL, team_key TEXT NOT NULL, team_name TEXT NOT NULL,
    league_id INTEGER, league_key TEXT NOT NULL, league_name TEXT NOT NULL, position TEXT NOT NULL,
    jersey_number INTEGER, PRIMARY KEY(player_key, team_id)
  );
  CREATE TABLE league_edition (
    key TEXT PRIMARY KEY, version INTEGER NOT NULL, league_id INTEGER NOT NULL,
    league_key TEXT NOT NULL, league_name TEXT NOT NULL, country_id INTEGER,
    country_name TEXT NOT NULL, country_code TEXT NOT NULL, level INTEGER,
    is_women INTEGER, team_count INTEGER NOT NULL DEFAULT 0,
    player_count INTEGER NOT NULL DEFAULT 0, raw_json TEXT NOT NULL,
    UNIQUE(version, league_id)
  );
  CREATE TABLE team_edition (
    key TEXT PRIMARY KEY, version INTEGER NOT NULL, team_id INTEGER NOT NULL,
    team_key TEXT NOT NULL, team_name TEXT NOT NULL, league_id INTEGER,
    league_key TEXT NOT NULL, league_name TEXT NOT NULL, country_id INTEGER,
    country_name TEXT NOT NULL, country_code TEXT NOT NULL,
    is_national INTEGER NOT NULL CHECK (is_national IN (0, 1)),
    squad_size INTEGER NOT NULL DEFAULT 0, overall INTEGER, attack INTEGER,
    midfield INTEGER, defence INTEGER, foundation_year INTEGER, raw_json TEXT NOT NULL,
    UNIQUE(version, team_id)
  );
  CREATE TABLE referee_edition (
    key TEXT PRIMARY KEY, version INTEGER NOT NULL, referee_id INTEGER NOT NULL,
    referee_key TEXT NOT NULL, referee_name TEXT NOT NULL, first_name TEXT NOT NULL,
    last_name TEXT NOT NULL, nationality_id INTEGER NOT NULL,
    nationality_key TEXT NOT NULL, nationality_name TEXT NOT NULL, nationality_code TEXT NOT NULL,
    birth_date TEXT, snapshot_date TEXT NOT NULL, age INTEGER,
    gender INTEGER NOT NULL CHECK (gender IN (0, 1)), height INTEGER, weight INTEGER,
    foul_strictness INTEGER, card_strictness INTEGER, is_real INTEGER,
    league_count INTEGER NOT NULL DEFAULT 0, raw_json TEXT NOT NULL,
    UNIQUE(version, referee_id)
  );
  CREATE TABLE stadium_edition (
    key TEXT PRIMARY KEY, version INTEGER NOT NULL, stadium_id INTEGER NOT NULL,
    stadium_key TEXT NOT NULL, stadium_name TEXT NOT NULL, country_id INTEGER,
    country_name TEXT NOT NULL, country_code TEXT NOT NULL, capacity INTEGER NOT NULL,
    year_built INTEGER, pitch_length INTEGER, pitch_width INTEGER,
    is_licensed INTEGER, is_small_sided INTEGER,
    team_count INTEGER NOT NULL DEFAULT 0, raw_json TEXT NOT NULL,
    UNIQUE(version, stadium_id)
  );
  CREATE TABLE referee_league (
    referee_key TEXT NOT NULL REFERENCES referee_edition(key) ON DELETE CASCADE,
    version INTEGER NOT NULL, referee_id INTEGER NOT NULL, league_id INTEGER NOT NULL,
    league_key TEXT NOT NULL, league_name TEXT NOT NULL,
    PRIMARY KEY(referee_key, league_id)
  );
  CREATE TABLE stadium_team (
    stadium_key TEXT NOT NULL REFERENCES stadium_edition(key) ON DELETE CASCADE,
    version INTEGER NOT NULL, stadium_id INTEGER NOT NULL, team_id INTEGER NOT NULL,
    team_key TEXT NOT NULL, team_name TEXT NOT NULL,
    PRIMARY KEY(stadium_key, team_id)
  );
  CREATE VIRTUAL TABLE player_search USING fts5(player_key UNINDEXED, display_name, aliases, teams,
    nationality, leagues, tokenize='unicode61 remove_diacritics 2');
`);

const rawTableName = (fifa: Fifa, table: Table): string => `raw_${fifa}_${table}`;

const requiredTables = (fifa: Fifa): Table[] => [
  Table.Players,
  Table.PlayerNames,
  Table.Nations,
  Table.Teams,
  Table.Leagues,
  Table.Referee,
  Table.Stadiums,
  Table.LeagueTeamLinks,
  Table.TeamPlayerLinks,
  Table.TeamStadiumLinks,
  ...(fifa === Fifa.Fifa11 ? [] : [Table.LeagueRefereeLinks]),
];

const headerEquals = (actual: readonly string[], expected: readonly string[]): boolean =>
  actual.length === expected.length && actual.every((value, index) => value === expected[index]);

const readHeader = (path: string): string[] => {
  const size = statSync(path).size;
  if (!size) return [];
  const descriptor = openSync(path, 'r');
  try {
    const buffer = Buffer.alloc(Math.min(size, 256 * 1024));
    const bytes = readSync(descriptor, buffer, 0, buffer.length, 0);
    const content = decodeFifaText(buffer.subarray(0, bytes));
    const end = content.search(/\r?\n/);
    if (end < 0 && size > buffer.length)
      throw new Error('Header exceeds the supported 256 KiB limit.');
    const header = end < 0 ? content : content.slice(0, end);
    return header ? parseTsvLine(header) : [];
  } finally {
    closeSync(descriptor);
  }
};

const expectedHeader = (fifa: Fifa, table: Table): string[] =>
  [...fifaTableConfig(fifa, table)].sort(sortByOrder).map((field) => field.name);

const compatibleT3dbFieldType = (field: Field, type: FifaXmlFieldType): boolean => {
  if (field.type === Datatype.String) return type === 'DBOFIELDTYPE_STRING';
  if (field.type === Datatype.Float) return type === 'DBOFIELDTYPE_REAL';
  return type === 'DBOFIELDTYPE_INTEGER' || type === 'DBOFIELDTYPE_DATE';
};

const t3dbTableCompatibility = (
  database: FifaDatabase,
  fifa: Fifa,
  table: Table,
): { missing: string[]; incompatible: string[]; extra: string[] } => {
  const schema = database.schema.tables.find(({ name }) => name === table);
  const expected = fifaTableConfig(fifa, table);
  if (!schema)
    return {
      missing: expected.map(({ name }) => name),
      incompatible: [],
      extra: [],
    };
  const actual = new Map(schema.fields.map((field) => [field.name, field]));
  const expectedNames = new Set(expected.map(({ name }) => name));
  return {
    missing: expected.filter(({ name }) => !actual.has(name)).map(({ name }) => name),
    incompatible: expected
      .filter((field) => {
        const candidate = actual.get(field.name);
        return candidate !== undefined && !compatibleT3dbFieldType(field, candidate.type);
      })
      .map(({ name }) => name),
    extra: schema.fields.filter(({ name }) => !expectedNames.has(name)).map(({ name }) => name),
  };
};

const versionMatchesT3dbSchema = (database: FifaDatabase, fifa: Fifa): boolean =>
  requiredTables(fifa).every((table) => {
    const compatibility = t3dbTableCompatibility(database, fifa, table);
    return (
      compatibility.missing.length === 0 &&
      compatibility.incompatible.length === 0 &&
      compatibility.extra.length === 0
    );
  });

export const inspectT3dbDatabase = (
  database: FifaDatabase,
  selectedVersion?: number,
): SourceHeaderInspection => {
  const matchingVersions = FIFAS.filter((fifa) => versionMatchesT3dbSchema(database, fifa))
    .map((fifa) => Number(fifa.slice(4)))
    .sort((left, right) => right - left);
  const detection =
    matchingVersions.length === 1
      ? ('detected' as const)
      : matchingVersions.length > 1
        ? ('ambiguous' as const)
        : ('unknown' as const);
  const detectedVersion = detection === 'detected' ? matchingVersions[0] : undefined;
  if (selectedVersion === undefined)
    return { detection, detectedVersion, matchingVersions, diagnostics: [] };

  const fifa = fifaForVersion(selectedVersion);
  const requiredT3dbTables = [
    ...requiredTables(fifa),
    ...(fifa === Fifa.Fifa11 ? [] : ['version']),
  ];
  const missingTables = requiredT3dbTables.filter(
    (table) => !database.schema.tables.some(({ name }) => name === table),
  );
  if (missingTables.length)
    return {
      detection,
      detectedVersion,
      matchingVersions,
      issue: {
        code: 'missing-files',
        message: `This t3db database is missing required tables: ${fileSummary(missingTables)}.`,
        files: missingTables.map((table) => `${table} table`),
        detectedVersion,
      },
      diagnostics: missingTables.map((table) => `Missing required t3db table: ${table}`),
    };

  const invalid = requiredTables(fifa).flatMap((table) => {
    const compatibility = t3dbTableCompatibility(database, fifa, table);
    return [
      ...compatibility.missing.map((field) => `${table}.${field} is missing`),
      ...compatibility.incompatible.map((field) => `${table}.${field} has an incompatible type`),
    ];
  });
  if (!invalid.length) {
    if (detectedVersion !== undefined && detectedVersion !== selectedVersion)
      return {
        detection,
        detectedVersion,
        matchingVersions,
        issue: {
          code: 'version-mismatch',
          message: `This t3db schema appears to be FIFA ${detectedVersion}, but FIFA ${selectedVersion} is selected.`,
          files: [],
          detectedVersion,
        },
        diagnostics: [],
      };
    return { detection, detectedVersion, matchingVersions, diagnostics: [] };
  }
  return {
    detection,
    detectedVersion,
    matchingVersions,
    issue: {
      code: detectedVersion === undefined ? 'header-mismatch' : 'version-mismatch',
      message:
        detectedVersion !== undefined
          ? `This t3db schema appears to be FIFA ${detectedVersion}, but FIFA ${selectedVersion} is selected.`
          : `The t3db schema is not compatible with FIFA ${selectedVersion}.`,
      files: [...new Set(invalid.map((entry) => `${entry.split('.')[0]} table`))],
      detectedVersion,
    },
    diagnostics: invalid,
  };
};

const fileSummary = (files: readonly string[]): string => {
  const visible = files.slice(0, 3);
  const remaining = files.length - visible.length;
  return `${visible.join(', ')}${remaining ? ` and ${remaining} more` : ''}`;
};

const isFile = (path: string): boolean => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

const versionMatchesRequiredHeaders = (sourcePath: string, fifa: Fifa): boolean =>
  requiredTables(fifa).every((table) => {
    const path = join(sourcePath, `${table}.txt`);
    if (!isFile(path)) return false;
    try {
      const expected = expectedHeader(fifa, table);
      return expected.length > 0 && headerEquals(readHeader(path), expected);
    } catch {
      return false;
    }
  });

export const inspectSourceHeaders = (
  sourcePath: string,
  selectedVersion?: number,
): SourceHeaderInspection => {
  const matchingVersions = FIFAS.filter((fifa) => versionMatchesRequiredHeaders(sourcePath, fifa))
    .map((fifa) => Number(fifa.slice(4)))
    .sort((left, right) => right - left);
  const detection =
    matchingVersions.length === 1
      ? ('detected' as const)
      : matchingVersions.length > 1
        ? ('ambiguous' as const)
        : ('unknown' as const);
  const detectedVersion = detection === 'detected' ? matchingVersions[0] : undefined;
  if (selectedVersion === undefined)
    return { detection, detectedVersion, matchingVersions, diagnostics: [] };

  const fifa = fifaForVersion(selectedVersion);
  const missing = requiredTables(fifa)
    .map((table) => `${table}.txt`)
    .filter((file) => !isFile(join(sourcePath, file)));
  if (fifa !== Fifa.Fifa11 && !isFile(join(sourcePath, 'version.txt'))) missing.push('version.txt');
  if (missing.length)
    return {
      detection,
      detectedVersion,
      matchingVersions,
      issue: {
        code: 'missing-files',
        message: `This folder is missing required files: ${fileSummary(missing)}.`,
        files: missing,
        detectedVersion,
      },
      diagnostics: missing.map((file) => `Missing required source file: ${join(sourcePath, file)}`),
    };

  const empty: string[] = [];
  const mismatched: string[] = [];
  const diagnostics: string[] = [];
  for (const table of TABLES) {
    const file = `${table}.txt`;
    const path = join(sourcePath, file);
    const expected = expectedHeader(fifa, table);
    if (!expected.length || !isFile(path)) continue;
    try {
      const actual = readHeader(path);
      if (!actual.length) {
        empty.push(file);
        diagnostics.push(`Empty source header: ${path}`);
      } else if (!headerEquals(actual, expected)) {
        mismatched.push(file);
        diagnostics.push(
          `Header mismatch in ${path}.\nExpected: ${expected.join('\t')}\nActual: ${actual.join('\t')}`,
        );
      }
    } catch (error) {
      mismatched.push(file);
      diagnostics.push(
        `Could not read source header ${path}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  const invalidFiles = [...empty, ...mismatched];
  if (!invalidFiles.length)
    return { detection, detectedVersion, matchingVersions, diagnostics: [] };
  if (detectedVersion !== undefined && detectedVersion !== selectedVersion)
    return {
      detection,
      detectedVersion,
      matchingVersions,
      issue: {
        code: 'version-mismatch',
        message: `This folder appears to be FIFA ${detectedVersion}, but FIFA ${selectedVersion} is selected.`,
        files: invalidFiles,
        detectedVersion,
      },
      diagnostics,
    };
  return {
    detection,
    detectedVersion,
    matchingVersions,
    issue: {
      code: empty.length && !mismatched.length ? 'invalid-source' : 'header-mismatch',
      message:
        empty.length && mismatched.length
          ? `Some table files are empty or have invalid FIFA ${selectedVersion} headers: ${fileSummary(invalidFiles)}.`
          : empty.length
            ? `Some table files are empty or unreadable: ${fileSummary(empty)}.`
            : `Some table headers do not match FIFA ${selectedVersion}: ${fileSummary(mismatched)}.`,
      files: invalidFiles,
      detectedVersion,
    },
    diagnostics,
  };
};

const validateSources = (sources: readonly ImportSource[]): void => {
  for (const source of sources) {
    const inspection = isT3dbSource(source)
      ? inspectT3dbDatabase(source.database, Number(source.fifa.slice(4)))
      : inspectSourceHeaders(source.path, Number(source.fifa.slice(4)));
    if (inspection.issue)
      throw new ImportSourceValidationError(inspection.issue, inspection.diagnostics);
  }
};

const addHeaderInspectionIssue = (
  accumulator: SourceValidationAccumulator,
  issue: ImportSourceIssue,
  fallbackFile = 'Source folder',
): void => {
  const files = issue.files.length ? issue.files : [fallbackFile];
  for (const file of files)
    accumulator.add({
      severity: 'error',
      code: issue.code,
      file,
      message: issue.message,
      group: issue.code,
      samples: [],
    });
};

const addRelationshipWarnings = (
  rowsByTable: ReadonlyMap<Table, RawRow[]>,
  accumulator: SourceValidationAccumulator,
  t3db = false,
): void => {
  const referenceIds = new Map<string, Set<string>>();
  const target = (table: Table, field: string): Set<string> => {
    const key = `${table}:${field}`;
    const cached = referenceIds.get(key);
    if (cached) return cached;
    const values = new Set((rowsByTable.get(table) ?? []).map((row) => String(row[field])));
    referenceIds.set(key, values);
    return values;
  };
  const checks: {
    table: Table;
    field: string;
    targetTable: Table;
    targetField: string;
  }[] = [
    {
      table: Table.LeagueTeamLinks,
      field: 'leagueid',
      targetTable: Table.Leagues,
      targetField: 'leagueid',
    },
    {
      table: Table.LeagueTeamLinks,
      field: 'teamid',
      targetTable: Table.Teams,
      targetField: 'teamid',
    },
    {
      table: Table.TeamPlayerLinks,
      field: 'teamid',
      targetTable: Table.Teams,
      targetField: 'teamid',
    },
    {
      table: Table.TeamPlayerLinks,
      field: 'playerid',
      targetTable: Table.Players,
      targetField: 'playerid',
    },
    {
      table: Table.TeamStadiumLinks,
      field: 'teamid',
      targetTable: Table.Teams,
      targetField: 'teamid',
    },
    {
      table: Table.TeamStadiumLinks,
      field: 'stadiumid',
      targetTable: Table.Stadiums,
      targetField: 'stadiumid',
    },
    {
      table: Table.LeagueRefereeLinks,
      field: 'leagueid',
      targetTable: Table.Leagues,
      targetField: 'leagueid',
    },
    {
      table: Table.LeagueRefereeLinks,
      field: 'refereeid',
      targetTable: Table.Referee,
      targetField: 'refereeid',
    },
  ];
  for (const check of checks) {
    const rows = rowsByTable.get(check.table);
    const targets = rowsByTable.get(check.targetTable);
    if (!rows || !targets) continue;
    const known = target(check.targetTable, check.targetField);
    for (const [rowIndex, row] of rows.entries()) {
      const value = String(row[check.field]);
      if (known.has(value)) continue;
      accumulator.add({
        severity: 'warning',
        code: 'missing-reference',
        file: tableIssueFile(check.table, t3db),
        field: check.field,
        message: `Referenced ${check.targetTable}.${check.targetField} value does not exist.`,
        group: `${check.targetTable}:${check.targetField}`,
        samples: [
          t3db
            ? { record: rowIndex + 1, value: sampleValue(value) }
            : { line: rowIndex + 2, value: sampleValue(value) },
        ],
      });
    }
  }
};

export const validateSourceData = (
  source: ImportSource,
  progress?: (message: string) => void,
): DatabaseSourceValidationReport => {
  const accumulator = new SourceValidationAccumulator();
  const version = Number(source.fifa.slice(4));
  const t3db = isT3dbSource(source);
  const inspection = t3db
    ? inspectT3dbDatabase(source.database, version)
    : inspectSourceHeaders(source.path, version);
  if (inspection.issue) {
    addHeaderInspectionIssue(accumulator, inspection.issue, t3db ? 't3db schema' : 'Source folder');
    return accumulator.report();
  }
  const configuredTables = TABLES.filter((table) => {
    if (fifaTableConfig(source.fifa, table).length === 0) return false;
    return t3db
      ? source.database.schema.tables.some(({ name }) => name === table)
      : isFile(join(source.path, `${table}.txt`));
  });
  const rowsByTable = new Map<Table, RawRow[]>();
  for (const [index, table] of configuredTables.entries()) {
    const file = tableIssueFile(table, t3db);
    progress?.(`Validating ${file} (${index + 1}/${configuredTables.length})…`);
    const fields = [...fifaTableConfig(source.fifa, table)].sort(sortByOrder);
    try {
      rowsByTable.set(
        table,
        t3db
          ? readT3dbTable(source.database, table, fields, accumulator)
          : readTable(join(source.path, `${table}.txt`), fields, { table, accumulator }),
      );
    } catch (error) {
      addMalformedFileIssue(
        accumulator,
        file,
        error instanceof Error ? error.message : 'The table could not be read.',
      );
    }
  }
  addRelationshipWarnings(rowsByTable, accumulator, t3db);
  return accumulator.report();
};

const importRawTables = (
  db: DatabaseSync,
  sources: readonly ImportSource[],
): { files: number; rows: number } => {
  let files = 0;
  let rows = 0;
  const sourceStatement = db.prepare('INSERT INTO import_source VALUES (?, ?, ?, ?, ?)');
  const missing = db.prepare('INSERT INTO import_missing VALUES (?, ?, ?)');
  const insertTable = (
    fifa: Fifa,
    table: Table,
    fields: Field[],
    data: RawRow[],
    sourcePath: string,
    sourceBytes: number,
  ): void => {
    const columns = fields.map(
      (field) =>
        `${quote(field.name)} ${field.type === Datatype.String ? 'TEXT' : field.type === Datatype.Float ? 'REAL' : 'INTEGER'}`,
    );
    db.exec(`CREATE TABLE ${quote(rawTableName(fifa, table))} (${columns.join(',')})`);
    const insert = db.prepare(
      `INSERT INTO ${quote(rawTableName(fifa, table))} VALUES (${fields.map(() => '?').join(',')})`,
    );
    db.exec('BEGIN');
    try {
      for (const row of data)
        insert.run(...fields.map((field) => row[field.name] as SQLInputValue));
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
    sourceStatement.run(Number(fifa.slice(4)), table, sourcePath, data.length, sourceBytes);
    files += 1;
    rows += data.length;
  };
  for (const importSource of sources)
    for (const table of TABLES) {
      const { fifa } = importSource;
      const version = Number(fifa.slice(4));
      const fields = [...fifaTableConfig(fifa, table)].sort(sortByOrder);
      if (isT3dbSource(importSource)) {
        const tableInfo = importSource.database.listTables().find(({ name }) => name === table);
        if (!fields.length) {
          missing.run(version, table, 'No fifatables definition');
          continue;
        }
        if (!tableInfo) {
          missing.run(version, table, 'Source table is missing');
          continue;
        }
        const accumulator = new SourceValidationAccumulator();
        const data = readT3dbTable(importSource.database, table, fields, accumulator, true);
        insertTable(
          fifa,
          table,
          fields,
          data,
          `${importSource.databasePath}#${table}`,
          tableInfo.recordSize * tableInfo.recordCount + tableInfo.compressedStringLength,
        );
        continue;
      }
      const sourcePath = importSource.path;
      const path = join(sourcePath, `${table}.txt`);
      let fileStat: ReturnType<typeof statSync> | undefined;
      try {
        fileStat = statSync(path);
      } catch {
        // Reported below with the most specific available reason.
      }
      if (!fields.length) {
        const sourceLines = fileStat
          ? decodeFifaText(readFileSync(path)).split(/\r?\n/).filter(Boolean)
          : [];
        if (fileStat && sourceLines.length <= 1) {
          sourceStatement.run(version, table, path, 0, fileStat.size);
          missing.run(version, table, 'Header-only source has no fifatables definition');
          files += 1;
          continue;
        }
        missing.run(version, table, 'No fifatables definition');
        continue;
      }
      if (!fileStat) {
        missing.run(version, table, 'Source file is missing');
        continue;
      }
      const accumulator = new SourceValidationAccumulator();
      let data: RawRow[];
      try {
        data = readTable(path, fields, { table, accumulator, throwOnErrors: true });
      } catch (error) {
        if (error instanceof ImportSourceValidationError) throw error;
        addMalformedFileIssue(
          accumulator,
          `${table}.txt`,
          error instanceof Error ? error.message : 'The table could not be read.',
        );
        throw validationError(`${table}.txt`, accumulator);
      }
      insertTable(fifa, table, fields, data, path, Number(fileStat.size));
    }
  return { files, rows };
};

const tableRows = (db: DatabaseSync, fifa: Fifa, table: Table): SqlRow[] =>
  db.prepare(`SELECT * FROM ${quote(rawTableName(fifa, table))}`).all() as SqlRow[];
const mapBy = (rows: SqlRow[], key: string, value: string): Map<number, string> =>
  new Map(rows.map((row) => [asNumber(row[key]), asText(row[value])]));
const optionalTableRows = (db: DatabaseSync, fifa: Fifa, table: Table): SqlRow[] => {
  const tableName = rawTableName(fifa, table);
  const exists = db
    .prepare("SELECT 1 FROM sqlite_schema WHERE type = 'table' AND name = ?")
    .get(tableName);
  return exists ? tableRows(db, fifa, table) : [];
};
const playerNamesById = (db: DatabaseSync, fifa: Fifa): Map<number, string> => {
  const names = mapBy(tableRows(db, fifa, Table.PlayerNames), 'nameid', 'name');
  for (const row of optionalTableRows(db, fifa, Table.DcPlayerNames)) {
    const nameId = asNumber(row['nameid']);
    if (!names.has(nameId)) names.set(nameId, asText(row['name']));
  }
  return names;
};
export const sourceSnapshotDate = (source: ImportSource): string => {
  const { fifa } = source;
  if (fifa === Fifa.Fifa11) return '2010-10-01';
  if (isT3dbSource(source)) {
    const exportDate = source.database.readTable('version').rows[0]?.['exportdate'];
    return isoDate(exportDate ?? 0) ?? `${Number(fifa.slice(4)) - 1}-10-01`;
  }
  const sourcePath = source.path;
  const path = join(sourcePath, 'version.txt');
  const lines = decodeFifaText(readFileSync(path)).split(/\r?\n/);
  const header = parseTsvLine(lines[0]);
  const values = parseTsvLine(lines[1]);
  return isoDate(values[header.indexOf('exportdate')]) ?? `${Number(fifa.slice(4)) - 1}-10-01`;
};

const ratingFor = (
  fifa: Fifa,
  player: SqlRow,
  overall: number,
  preferred: string,
): { bestPosition: string; bestRating: number; ratings: Record<string, number> } => {
  if (fifa === Fifa.Fifa11)
    return { bestPosition: preferred, bestRating: overall, ratings: { [preferred]: overall } };
  const attributes = Object.fromEntries(
    Object.values(Attribute).map((attribute) => [attribute, asNumber(player[attribute], overall)]),
  ) as Record<Attribute, number>;
  const ratingFifa = fifa as unknown as RatingFifa;
  const ratings = Object.fromEntries(
    POSITION_IDS.map((position) => [
      position,
      Math.round(CalculateUtils.rawOverall(attributes, ratingFifa, position)),
    ]),
  );
  const [bestPosition, bestRating] = Object.entries(ratings).sort((a, b) => b[1] - a[1])[0];
  return { bestPosition, bestRating, ratings };
};

const buildCanonical = (
  db: DatabaseSync,
  sources: readonly ImportSource[],
): {
  players: number;
  links: number;
  teams: number;
  leagues: number;
  referees: number;
  stadiums: number;
  refereeLeagueLinks: number;
  stadiumTeamLinks: number;
} => {
  const playerInsert = db.prepare(
    `INSERT INTO player_edition VALUES (${Array.from({ length: 30 }, () => '?').join(',')})`,
  );
  const linkInsert = db.prepare(
    'INSERT OR IGNORE INTO player_team VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const teamInsert = db.prepare(
    `INSERT INTO team_edition VALUES (${Array.from({ length: 19 }, () => '?').join(',')})`,
  );
  const leagueInsert = db.prepare(
    `INSERT INTO league_edition VALUES (${Array.from({ length: 13 }, () => '?').join(',')})`,
  );
  const refereeInsert = db.prepare(
    `INSERT INTO referee_edition VALUES (${Array.from({ length: 22 }, () => '?').join(',')})`,
  );
  const stadiumInsert = db.prepare(
    `INSERT INTO stadium_edition VALUES (${Array.from({ length: 16 }, () => '?').join(',')})`,
  );
  const refereeLeagueInsert = db.prepare(
    'INSERT OR IGNORE INTO referee_league VALUES (?, ?, ?, ?, ?, ?)',
  );
  const stadiumTeamInsert = db.prepare(
    'INSERT OR IGNORE INTO stadium_team VALUES (?, ?, ?, ?, ?, ?)',
  );
  const nationalityCodeFallback = collectNationalityCodes(
    sources
      .filter(({ fifa }) => Number(fifa.slice(4)) >= 16)
      .flatMap(({ fifa }) => tableRows(db, fifa, Table.Nations)),
  );
  let players = 0;
  let links = 0;
  let teamsCount = 0;
  let leaguesCount = 0;
  let refereesCount = 0;
  let stadiumsCount = 0;
  let refereeLeagueLinks = 0;
  let stadiumTeamLinks = 0;
  for (const importSource of sources) {
    const { fifa } = importSource;
    const version = Number(fifa.slice(4));
    const snapshot = sourceSnapshotDate(importSource);
    const names = playerNamesById(db, fifa);
    const nationRows = tableRows(db, fifa, Table.Nations);
    const nations = mapBy(nationRows, 'nationid', 'nationname');
    const nationCodes = new Map(
      nationRows.map((row) => {
        const nationId = asNumber(row['nationid']);
        return [
          nationId,
          resolveNationalityCode(nationId, row['isocountrycode'], nationalityCodeFallback),
        ];
      }),
    );
    const teamRows = tableRows(db, fifa, Table.Teams);
    const leagueRows = tableRows(db, fifa, Table.Leagues);
    const teams = mapBy(teamRows, 'teamid', 'teamname');
    const leagues = mapBy(leagueRows, 'leagueid', 'leaguename');
    const teamIds = new Set(teamRows.map((row) => asNumber(row['teamid'])));
    const leagueIds = new Set(leagueRows.map((row) => asNumber(row['leagueid'])));
    const refereeRows = tableRows(db, fifa, Table.Referee);
    const stadiumRows = tableRows(db, fifa, Table.Stadiums);
    const refereeIds = new Set(refereeRows.map((row) => asNumber(row['refereeid'])));
    const stadiumIds = new Set(stadiumRows.map((row) => asNumber(row['stadiumid'])));
    const leagueRowsById = new Map(leagueRows.map((row) => [asNumber(row['leagueid']), row]));
    const teamLeagues = new Map<number, number>();
    for (const row of tableRows(db, fifa, Table.LeagueTeamLinks))
      teamLeagues.set(asNumber(row['teamid']), asNumber(row['leagueid']));
    const rowTeamNations = new Map<number, number>();
    for (const row of optionalTableRows(db, fifa, Table.RowTeamNationLinks))
      rowTeamNations.set(asNumber(row['teamid']), asNumber(row['nationid']));
    const teamNations = new Map<number, number>();
    for (const row of optionalTableRows(db, fifa, Table.TeamNationLinks))
      teamNations.set(asNumber(row['teamid']), asNumber(row['nationid']));
    const memberships = new Map<number, SqlRow[]>();
    for (const row of tableRows(db, fifa, Table.TeamPlayerLinks)) {
      const id = asNumber(row['playerid']);
      memberships.set(id, [...(memberships.get(id) ?? []), row]);
    }
    db.exec('BEGIN');
    try {
      for (const league of leagueRows) {
        const leagueId = asNumber(league['leagueid']);
        const leagueName = asText(league['leaguename']);
        const countryId = optionalNumber(league['countryid']);
        leagueInsert.run(
          `${version}:${leagueId}`,
          version,
          leagueId,
          normalize(leagueName),
          leagueName,
          countryId,
          countryId === null ? '' : (nations.get(countryId) ?? ''),
          countryId === null ? '' : (nationCodes.get(countryId) ?? ''),
          optionalNumber(league['level']),
          league['iswomencompetition'] === undefined
            ? null
            : Number(Boolean(asNumber(league['iswomencompetition']))),
          0,
          0,
          JSON.stringify(league),
        );
        leaguesCount += 1;
      }
      for (const team of teamRows) {
        const teamId = asNumber(team['teamid']);
        const teamName = asText(team['teamname']);
        const leagueId = teamLeagues.get(teamId) ?? null;
        const league = leagueId === null ? undefined : leagueRowsById.get(leagueId);
        const leagueName = leagueId === null ? '' : (leagues.get(leagueId) ?? '');
        const rowCountryId = rowTeamNations.get(teamId);
        const linkedCountryId = teamNations.get(teamId);
        const isNational = leagueId !== null && NATIONAL_TEAM_LEAGUE_IDS.has(leagueId);
        const countryId =
          rowCountryId ?? linkedCountryId ?? (league ? optionalNumber(league['countryid']) : null);
        teamInsert.run(
          `${version}:${teamId}`,
          version,
          teamId,
          normalize(teamName),
          teamName,
          leagueId,
          normalize(leagueName),
          leagueName,
          countryId,
          countryId === null ? '' : (nations.get(countryId) ?? ''),
          countryId === null ? '' : (nationCodes.get(countryId) ?? ''),
          Number(isNational),
          0,
          optionalNumber(team['overallrating']),
          optionalNumber(team['attackrating']),
          optionalNumber(team['midfieldrating']),
          optionalNumber(team['defenserating']),
          optionalPositiveNumber(team['foundationyear']),
          JSON.stringify(team),
        );
        teamsCount += 1;
      }
      for (const referee of refereeRows) {
        const refereeId = asNumber(referee['refereeid']);
        const firstName = asText(referee['firstname']);
        const lastName = asText(referee['surname']);
        const refereeName =
          [firstName, lastName].filter(Boolean).join(' ') || `Referee ${refereeId}`;
        const nationalityId = asNumber(referee['nationalitycode']);
        const nationalityName = nations.get(nationalityId) ?? '';
        const birthDate = isoDate(asNumber(referee['birthdate']));
        refereeInsert.run(
          `${version}:${refereeId}`,
          version,
          refereeId,
          normalize(refereeName),
          refereeName,
          firstName,
          lastName,
          nationalityId,
          normalize(nationalityName),
          nationalityName,
          nationCodes.get(nationalityId) ?? '',
          birthDate,
          snapshot,
          ageAt(birthDate, snapshot),
          normalizeGender(referee['gender']),
          optionalPositiveNumber(referee['height']),
          optionalPositiveNumber(referee['weight']),
          optionalNumber(referee['foulstrictness']),
          optionalNumber(referee['cardstrictness']),
          referee['isreal'] === undefined ? null : Number(Boolean(asNumber(referee['isreal']))),
          0,
          JSON.stringify(referee),
        );
        refereesCount += 1;
      }
      for (const stadium of stadiumRows) {
        const stadiumId = asNumber(stadium['stadiumid']);
        const stadiumName = asText(stadium['name']) || `Stadium ${stadiumId}`;
        const countryId = optionalPositiveNumber(stadium['countrycode']);
        stadiumInsert.run(
          `${version}:${stadiumId}`,
          version,
          stadiumId,
          normalize(stadiumName),
          stadiumName,
          countryId,
          countryId === null ? '' : (nations.get(countryId) ?? ''),
          countryId === null ? '' : (nationCodes.get(countryId) ?? ''),
          asNumber(stadium['capacity']),
          optionalPositiveNumber(stadium['yearbuilt']),
          optionalPositiveNumber(stadium['stadiumpitchlength']),
          optionalPositiveNumber(stadium['stadiumpitchwidth']),
          stadium['islicensed'] === undefined
            ? null
            : Number(Boolean(asNumber(stadium['islicensed']))),
          stadium['issmallsided'] === undefined
            ? null
            : Number(Boolean(asNumber(stadium['issmallsided']))),
          0,
          JSON.stringify(stadium),
        );
        stadiumsCount += 1;
      }
      const refereeLeagueRows =
        fifa === Fifa.Fifa11
          ? refereeRows.map((referee) => ({
              refereeid: referee['refereeid'],
              leagueid: referee['leagueid'],
            }))
          : tableRows(db, fifa, Table.LeagueRefereeLinks);
      for (const link of refereeLeagueRows) {
        const refereeId = asNumber(link['refereeid']);
        const leagueId = asNumber(link['leagueid']);
        if (!refereeIds.has(refereeId) || !leagueIds.has(leagueId)) continue;
        const result = refereeLeagueInsert.run(
          `${version}:${refereeId}`,
          version,
          refereeId,
          leagueId,
          normalize(leagues.get(leagueId) ?? ''),
          leagues.get(leagueId) ?? '',
        );
        refereeLeagueLinks += Number(result.changes);
      }
      for (const link of tableRows(db, fifa, Table.TeamStadiumLinks)) {
        const stadiumId = asNumber(link['stadiumid']);
        const teamId = asNumber(link['teamid']);
        if (!stadiumIds.has(stadiumId) || !teamIds.has(teamId)) continue;
        const result = stadiumTeamInsert.run(
          `${version}:${stadiumId}`,
          version,
          stadiumId,
          teamId,
          normalize(teams.get(teamId) ?? ''),
          teams.get(teamId) ?? '',
        );
        stadiumTeamLinks += Number(result.changes);
      }
      for (const player of tableRows(db, fifa, Table.Players)) {
        const playerId = asNumber(player['playerid']);
        const key = `${version}:${playerId}`;
        const first = names.get(asNumber(player['firstnameid'])) ?? '';
        const last = names.get(asNumber(player['lastnameid'])) ?? '';
        const common = names.get(asNumber(player['commonnameid'])) ?? '';
        const jersey = names.get(asNumber(player['playerjerseynameid'])) ?? '';
        const display =
          common || [first, last].filter(Boolean).join(' ') || jersey || `Player ${playerId}`;
        const positionIds = [1, 2, 3, 4].map((index) =>
          asNumber(player[`preferredposition${index}`], -1),
        );
        const positions = [...new Set(positionIds.map((id) => positionById[id]).filter(Boolean))];
        const preferred = positions[0] ?? 'Unknown';
        const overall = asNumber(player['overallrating']);
        const potential = asNumber(player['potential'], overall);
        const nationalityId = asNumber(player['nationality']);
        const nationality = nations.get(nationalityId) ?? '';
        const nationalityCode = nationCodes.get(nationalityId) ?? '';
        const birthDate = isoDate(asNumber(player['birthdate']));
        const attributes = Object.fromEntries(
          Object.values(Attribute).map((attribute) => [
            attribute,
            asNumber(player[attribute], overall),
          ]),
        );
        const rating = ratingFor(fifa, player, overall, preferred);
        playerInsert.run(
          key,
          version,
          playerId,
          display,
          first,
          last,
          common,
          jersey,
          [first, last, common, jersey].filter(Boolean).join(' '),
          nationalityId,
          nationalityCode,
          normalize(nationality),
          nationality,
          birthDate,
          snapshot,
          ageAt(birthDate, snapshot),
          normalizeGender(player['gender']),
          positions.join('|'),
          overall,
          potential,
          rating.bestPosition,
          rating.bestRating,
          player['height'] ?? null,
          player['weight'] ?? null,
          asText(player['preferredfoot']),
          asText(player['attackingworkrate']),
          asText(player['defensiveworkrate']),
          JSON.stringify(attributes),
          JSON.stringify(rating.ratings),
          JSON.stringify(player),
        );
        players += 1;
        for (const membership of memberships.get(playerId) ?? []) {
          const teamId = asNumber(membership['teamid']);
          const teamName = teams.get(teamId) ?? '';
          const leagueId = teamLeagues.get(teamId) ?? null;
          const leagueName = leagueId === null ? '' : (leagues.get(leagueId) ?? '');
          const result = linkInsert.run(
            key,
            version,
            playerId,
            teamId,
            normalize(teamName),
            teamName,
            leagueId,
            normalize(leagueName),
            leagueName,
            positionById[asNumber(membership['position'])] ?? asText(membership['position']),
            membership['jerseynumber'] ?? null,
          );
          links += Number(result.changes);
        }
      }
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  db.exec(`
    CREATE INDEX idx_player_team_edition ON player_team(version, team_id);
    CREATE INDEX idx_player_league_edition ON player_team(version, league_id);
    CREATE INDEX idx_team_league_edition ON team_edition(version, league_id);
    CREATE INDEX idx_referee_league_edition ON referee_league(version, league_id);
    CREATE INDEX idx_stadium_team_edition ON stadium_team(version, team_id);
    UPDATE team_edition SET squad_size = (
      SELECT count(DISTINCT player_key) FROM player_team pt
      WHERE pt.version = team_edition.version AND pt.team_id = team_edition.team_id
    );
    UPDATE league_edition SET
      team_count = (
        SELECT count(*) FROM team_edition t
        WHERE t.version = league_edition.version AND t.league_id = league_edition.league_id
      ),
      player_count = (
        SELECT count(DISTINCT player_key) FROM player_team pt
        WHERE pt.version = league_edition.version AND pt.league_id = league_edition.league_id
      );
    UPDATE referee_edition SET league_count = (
      SELECT count(*) FROM referee_league rl WHERE rl.referee_key = referee_edition.key
    );
    UPDATE stadium_edition SET team_count = (
      SELECT count(*) FROM stadium_team st WHERE st.stadium_key = stadium_edition.key
    );
    INSERT INTO player_search
      SELECT p.key, p.display_name, p.aliases, coalesce(group_concat(DISTINCT pt.team_name), ''),
        p.nationality_name, coalesce(group_concat(DISTINCT pt.league_name), '')
      FROM player_edition p LEFT JOIN player_team pt ON pt.player_key = p.key GROUP BY p.key;
    CREATE INDEX idx_player_version ON player_edition(version);
    CREATE INDEX idx_player_gender ON player_edition(gender);
    CREATE INDEX idx_player_nation ON player_edition(nationality_key);
    CREATE INDEX idx_player_age ON player_edition(age);
    CREATE INDEX idx_player_overall ON player_edition(overall);
    CREATE INDEX idx_player_potential ON player_edition(potential);
    CREATE INDEX idx_player_rating ON player_edition(best_rating);
    CREATE INDEX idx_team_key ON player_team(team_key);
    CREATE INDEX idx_league_key ON player_team(league_key);
    CREATE INDEX idx_team_player ON player_team(player_key);
    CREATE INDEX idx_team_edition_version ON team_edition(version);
    CREATE INDEX idx_team_edition_name ON team_edition(team_key);
    CREATE INDEX idx_team_edition_league ON team_edition(league_key);
    CREATE INDEX idx_team_edition_country ON team_edition(country_id);
    CREATE INDEX idx_team_edition_national ON team_edition(is_national);
    CREATE INDEX idx_team_edition_overall ON team_edition(overall);
    CREATE INDEX idx_league_edition_version ON league_edition(version);
    CREATE INDEX idx_league_edition_name ON league_edition(league_key);
    CREATE INDEX idx_league_edition_country ON league_edition(country_id);
    CREATE INDEX idx_referee_edition_version ON referee_edition(version);
    CREATE INDEX idx_referee_edition_gender ON referee_edition(gender);
    CREATE INDEX idx_referee_edition_name ON referee_edition(referee_key);
    CREATE INDEX idx_referee_edition_nation ON referee_edition(nationality_id);
    CREATE INDEX idx_referee_edition_age ON referee_edition(age);
    CREATE INDEX idx_referee_league_key ON referee_league(league_key);
    CREATE INDEX idx_referee_league_referee ON referee_league(referee_key);
    CREATE INDEX idx_stadium_edition_version ON stadium_edition(version);
    CREATE INDEX idx_stadium_edition_name ON stadium_edition(stadium_key);
    CREATE INDEX idx_stadium_edition_country ON stadium_edition(country_id);
    CREATE INDEX idx_stadium_edition_capacity ON stadium_edition(capacity);
    CREATE INDEX idx_stadium_team_key ON stadium_team(team_key);
    CREATE INDEX idx_stadium_team_stadium ON stadium_team(stadium_key);
  `);
  return {
    players,
    links,
    teams: teamsCount,
    leagues: leaguesCount,
    referees: refereesCount,
    stadiums: stadiumsCount,
    refereeLeagueLinks,
    stadiumTeamLinks,
  };
};

export const buildDatabase = (options: ImportOptions): ImportSummary => {
  if (!options.sources.length) throw new Error('At least one FIFA source is required.');
  const uniqueVersions = new Set(options.sources.map(({ fifa }) => fifa));
  if (uniqueVersions.size !== options.sources.length)
    throw new Error('Each FIFA version can only be imported once per database.');
  runPhase('Validating source folders', options.progress, () => validateSources(options.sources));
  mkdirSync(dirname(options.outputPath), { recursive: true });
  for (const path of [
    options.outputPath,
    `${options.outputPath}-shm`,
    `${options.outputPath}-wal`,
  ]) {
    try {
      unlinkSync(path);
    } catch {
      /* a clean output is optional */
    }
  }
  const db = new DatabaseSync(options.outputPath);
  let summary!: ImportSummary;
  try {
    runPhase('Creating schema', options.progress, () => createSchema(db));
    const raw = runPhase('Importing source tables', options.progress, () =>
      importRawTables(db, options.sources),
    );
    const canonical = runPhase('Building canonical data and indexes', options.progress, () =>
      buildCanonical(db, options.sources),
    );
    runPhase('Writing metadata', options.progress, () => {
      const metadata = db.prepare('INSERT INTO metadata VALUES (?, ?)');
      const values = {
        database_id: options.databaseId ?? 'built-in',
        database_name: options.databaseName ?? 'Built-in FIFA 11–23',
        database_kind: options.databaseKind ?? 'built-in',
        schema_version: DATABASE_SCHEMA_VERSION,
        generated_at: new Date().toISOString(),
        versions: options.sources
          .map(({ fifa }) => Number(fifa.slice(4)))
          .sort((left, right) => left - right)
          .join(','),
        source_files: raw.files,
        raw_rows: raw.rows,
        player_editions: canonical.players,
        team_editions: canonical.teams,
        league_editions: canonical.leagues,
        referee_editions: canonical.referees,
        stadium_editions: canonical.stadiums,
        referee_league_links: canonical.refereeLeagueLinks,
        stadium_team_links: canonical.stadiumTeamLinks,
        team_player_links: canonical.links,
      };
      for (const [key, value] of Object.entries(values)) metadata.run(key, String(value));
    });
    runPhase('Validating database', options.progress, () => {
      const integrity = db.prepare('PRAGMA integrity_check').get() as SqlRow;
      if (integrity['integrity_check'] !== 'ok')
        throw new Error(`SQLite integrity check failed: ${integrity['integrity_check']}`);
      const foreignKeys = db.prepare('PRAGMA foreign_key_check').all();
      if (foreignKeys.length)
        throw new Error(`SQLite foreign key check found ${foreignKeys.length} errors.`);
      if (
        options.verifyExpectedCounts !== false &&
        (canonical.players !== EXPECTED_EDITIONS ||
          canonical.links !== EXPECTED_TEAM_LINKS ||
          canonical.teams !== EXPECTED_TEAM_EDITIONS ||
          canonical.leagues !== EXPECTED_LEAGUE_EDITIONS ||
          canonical.referees !== EXPECTED_REFEREE_EDITIONS ||
          canonical.stadiums !== EXPECTED_STADIUM_EDITIONS ||
          canonical.refereeLeagueLinks !== EXPECTED_REFEREE_LEAGUE_LINKS ||
          canonical.stadiumTeamLinks !== EXPECTED_STADIUM_TEAM_LINKS)
      )
        throw new Error(
          `Unexpected canonical counts: ${canonical.players} players, ${canonical.teams} teams, ${canonical.leagues} leagues, ${canonical.referees} referees, ${canonical.stadiums} stadiums, ${canonical.links} player-team links, ${canonical.refereeLeagueLinks} referee-league links, ${canonical.stadiumTeamLinks} stadium-team links.`,
        );
    });
    summary = {
      sourceFiles: raw.files,
      rawRows: raw.rows,
      playerEditions: canonical.players,
      teamLinks: canonical.links,
      teamEditions: canonical.teams,
      leagueEditions: canonical.leagues,
      refereeEditions: canonical.referees,
      stadiumEditions: canonical.stadiums,
      refereeLeagueLinks: canonical.refereeLeagueLinks,
      stadiumTeamLinks: canonical.stadiumTeamLinks,
    };
  } finally {
    db.close();
  }
  runPhase('Optimizing search data and vacuuming', options.progress, () => {
    const optimizer = new DatabaseSync(options.outputPath);
    try {
      optimizer.exec(
        "INSERT INTO player_search(player_search) VALUES('optimize'); ANALYZE; PRAGMA journal_mode = DELETE; VACUUM;",
      );
    } finally {
      optimizer.close();
    }
  });
  return summary;
};
