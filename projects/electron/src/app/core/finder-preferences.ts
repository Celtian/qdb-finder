import { Service } from '@angular/core';
import {
  defaultFinderColumns,
  finderColumns,
  finderKinds,
  type FinderColumnKey,
  type FinderKind,
} from './finder-columns';
import type { Gender, NumberRange } from './qdb-contracts';

export interface FinderFilterLabel {
  key: string;
  label: string;
  countryCode?: string;
}

type FilterLabelMap = Record<string, FinderFilterLabel>;
type StringLabelMap = Record<string, string>;

export interface PlayerFinderFilters {
  databaseIds: string[];
  versions: number[];
  gender?: Gender;
  nationalities: string[];
  teams: string[];
  leagues: string[];
  positions: string[];
  age: NumberRange;
  overall: NumberRange;
  potential: NumberRange;
  labels: Record<'nationalities' | 'teams' | 'leagues', StringLabelMap>;
  nationalityCodes: StringLabelMap;
}

export interface TeamFinderFilters {
  databaseIds: string[];
  versions: number[];
  leagueKeys: string[];
  countryIds: number[];
  overall: NumberRange;
  attack: NumberRange;
  midfield: NumberRange;
  defence: NumberRange;
  labels: Record<'league' | 'country', FilterLabelMap>;
}

export interface LeagueFinderFilters {
  databaseIds: string[];
  versions: number[];
  countryIds: number[];
  levels: number[];
  countryLabels: FilterLabelMap;
}

export interface RefereeFinderFilters {
  databaseIds: string[];
  versions: number[];
  gender?: Gender;
  nationalityIds: number[];
  leagueKeys: string[];
  age: NumberRange;
  isReal?: boolean;
  labels: Record<'nationality' | 'league', FilterLabelMap>;
}

export interface StadiumFinderFilters {
  databaseIds: string[];
  versions: number[];
  countryIds: number[];
  teamKeys: string[];
  capacity: NumberRange;
  isLicensed?: boolean;
  labels: Record<'country' | 'team', FilterLabelMap>;
}

export interface FinderFilterPreferenceMap {
  players: PlayerFinderFilters;
  teams: TeamFinderFilters;
  leagues: LeagueFinderFilters;
  referees: RefereeFinderFilters;
  stadiums: StadiumFinderFilters;
}

export const finderColumnPreferenceKey = (finder: FinderKind): string =>
  `qdb-finder.visible-columns.${finder}`;
export const finderFilterPreferenceKey = (finder: FinderKind): string =>
  `qdb-finder.filters.${finder}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string'))]
    : [];

const numbers = (value: unknown): number[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item)),
        ),
      ]
    : [];

const range = (value: unknown): NumberRange => {
  if (!isRecord(value)) return {};
  const min =
    typeof value['min'] === 'number' && Number.isFinite(value['min']) ? value['min'] : undefined;
  const max =
    typeof value['max'] === 'number' && Number.isFinite(value['max']) ? value['max'] : undefined;
  return { ...(min === undefined ? {} : { min }), ...(max === undefined ? {} : { max }) };
};

const optionalBoolean = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

const gender = (value: unknown): Gender | undefined =>
  value === 'men' || value === 'women' ? value : undefined;

const stringLabels = (value: unknown): StringLabelMap => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
};

const filterLabels = (value: unknown): FilterLabelMap => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      if (!isRecord(item) || typeof item['label'] !== 'string') return [];
      const countryCode = typeof item['countryCode'] === 'string' ? item['countryCode'] : undefined;
      return [[key, { key, label: item['label'], ...(countryCode ? { countryCode } : {}) }]];
    }),
  );
};

const nestedStringLabels = (
  value: unknown,
  keys: readonly string[],
): Record<string, StringLabelMap> => {
  const record = isRecord(value) ? value : {};
  return Object.fromEntries(keys.map((key) => [key, stringLabels(record[key])])) as Record<
    string,
    StringLabelMap
  >;
};

const nestedFilterLabels = (
  value: unknown,
  keys: readonly string[],
): Record<string, FilterLabelMap> => {
  const record = isRecord(value) ? value : {};
  return Object.fromEntries(keys.map((key) => [key, filterLabels(record[key])])) as Record<
    string,
    FilterLabelMap
  >;
};

const defaults: FinderFilterPreferenceMap = {
  players: {
    databaseIds: [],
    versions: [],
    nationalities: [],
    teams: [],
    leagues: [],
    positions: [],
    age: {},
    overall: {},
    potential: {},
    labels: { nationalities: {}, teams: {}, leagues: {} },
    nationalityCodes: {},
  },
  teams: {
    databaseIds: [],
    versions: [],
    leagueKeys: [],
    countryIds: [],
    overall: {},
    attack: {},
    midfield: {},
    defence: {},
    labels: { league: {}, country: {} },
  },
  leagues: {
    databaseIds: [],
    versions: [],
    countryIds: [],
    levels: [],
    countryLabels: {},
  },
  referees: {
    databaseIds: [],
    versions: [],
    nationalityIds: [],
    leagueKeys: [],
    age: {},
    labels: { nationality: {}, league: {} },
  },
  stadiums: {
    databaseIds: [],
    versions: [],
    countryIds: [],
    teamKeys: [],
    capacity: {},
    labels: { country: {}, team: {} },
  },
};

const normalizeFilters = <K extends FinderKind>(
  finder: K,
  value: unknown,
): FinderFilterPreferenceMap[K] => {
  const item = isRecord(value) ? value : {};
  switch (finder) {
    case 'players':
      return {
        databaseIds: strings(item['databaseIds']),
        versions: numbers(item['versions']),
        ...(gender(item['gender']) ? { gender: gender(item['gender']) } : {}),
        nationalities: strings(item['nationalities']),
        teams: strings(item['teams']),
        leagues: strings(item['leagues']),
        positions: strings(item['positions']),
        age: range(item['age']),
        overall: range(item['overall']),
        potential: range(item['potential']),
        labels: nestedStringLabels(item['labels'], ['nationalities', 'teams', 'leagues']),
        nationalityCodes: stringLabels(item['nationalityCodes']),
      } as FinderFilterPreferenceMap[K];
    case 'teams':
      return {
        databaseIds: strings(item['databaseIds']),
        versions: numbers(item['versions']),
        leagueKeys: strings(item['leagueKeys']),
        countryIds: numbers(item['countryIds']),
        overall: range(item['overall']),
        attack: range(item['attack']),
        midfield: range(item['midfield']),
        defence: range(item['defence']),
        labels: nestedFilterLabels(item['labels'], ['league', 'country']),
      } as FinderFilterPreferenceMap[K];
    case 'leagues':
      return {
        databaseIds: strings(item['databaseIds']),
        versions: numbers(item['versions']),
        countryIds: numbers(item['countryIds']),
        levels: numbers(item['levels']),
        countryLabels: filterLabels(item['countryLabels']),
      } as FinderFilterPreferenceMap[K];
    case 'referees':
      return {
        databaseIds: strings(item['databaseIds']),
        versions: numbers(item['versions']),
        ...(gender(item['gender']) ? { gender: gender(item['gender']) } : {}),
        nationalityIds: numbers(item['nationalityIds']),
        leagueKeys: strings(item['leagueKeys']),
        age: range(item['age']),
        ...(optionalBoolean(item['isReal']) === undefined
          ? {}
          : { isReal: optionalBoolean(item['isReal']) }),
        labels: nestedFilterLabels(item['labels'], ['nationality', 'league']),
      } as FinderFilterPreferenceMap[K];
    case 'stadiums':
      return {
        databaseIds: strings(item['databaseIds']),
        versions: numbers(item['versions']),
        countryIds: numbers(item['countryIds']),
        teamKeys: strings(item['teamKeys']),
        capacity: range(item['capacity']),
        ...(optionalBoolean(item['isLicensed']) === undefined
          ? {}
          : { isLicensed: optionalBoolean(item['isLicensed']) }),
        labels: nestedFilterLabels(item['labels'], ['country', 'team']),
      } as FinderFilterPreferenceMap[K];
  }
};

@Service()
export class FinderPreferences {
  loadColumns(finder: FinderKind): FinderColumnKey[] {
    const fallback = defaultFinderColumns(finder);
    try {
      const stored = window.localStorage.getItem(finderColumnPreferenceKey(finder));
      if (stored === null) return fallback;
      const value: unknown = JSON.parse(stored);
      return Array.isArray(value) ? this.normalizeColumns(finder, value) : fallback;
    } catch {
      return fallback;
    }
  }

  saveColumns(finder: FinderKind, columns: readonly FinderColumnKey[]): void {
    this.store(finderColumnPreferenceKey(finder), this.normalizeColumns(finder, columns));
  }

  loadFilters<K extends FinderKind>(finder: K): FinderFilterPreferenceMap[K] {
    try {
      const stored = window.localStorage.getItem(finderFilterPreferenceKey(finder));
      if (stored === null) return structuredClone(defaults[finder]);
      const value: unknown = JSON.parse(stored);
      if (!isRecord(value) || value['version'] !== 1) return structuredClone(defaults[finder]);
      return normalizeFilters(finder, value['filters']);
    } catch {
      return structuredClone(defaults[finder]);
    }
  }

  saveFilters<K extends FinderKind>(finder: K, filters: FinderFilterPreferenceMap[K]): void {
    this.store(finderFilterPreferenceKey(finder), {
      version: 1,
      filters: normalizeFilters(finder, filters),
    });
  }

  clearFilters(finder: FinderKind): void {
    this.remove(finderFilterPreferenceKey(finder));
  }

  resetFilters(): void {
    for (const finder of finderKinds) this.clearFilters(finder);
  }

  resetAll(): void {
    this.resetFilters();
    for (const finder of finderKinds) this.remove(finderColumnPreferenceKey(finder));
  }

  private normalizeColumns(finder: FinderKind, values: readonly unknown[]): FinderColumnKey[] {
    const selected = new Set(values.filter((value): value is string => typeof value === 'string'));
    return finderColumns[finder]
      .filter((column) => column.required || selected.has(column.key))
      .map((column) => column.key);
  }

  private store(key: string, value: unknown): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Finder preferences remain optional when local storage is unavailable.
    }
  }

  private remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Finder preferences remain optional when local storage is unavailable.
    }
  }
}
