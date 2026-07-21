import { Service } from '@angular/core';
import {
  defaultFinderColumns,
  finderColumns,
  type FinderColumnKey,
  type FinderKind,
} from './finder-columns';

export const finderColumnPreferenceKey = (finder: FinderKind): string =>
  `qdb-finder.visible-columns.${finder}`;

@Service()
export class FinderColumnPreferences {
  load(finder: FinderKind): FinderColumnKey[] {
    const defaults = defaultFinderColumns(finder);
    try {
      const stored = window.localStorage.getItem(finderColumnPreferenceKey(finder));
      if (stored === null) return defaults;
      const value: unknown = JSON.parse(stored);
      return Array.isArray(value) ? this.normalize(finder, value) : defaults;
    } catch {
      return defaults;
    }
  }

  save(finder: FinderKind, columns: readonly FinderColumnKey[]): void {
    try {
      window.localStorage.setItem(
        finderColumnPreferenceKey(finder),
        JSON.stringify(this.normalize(finder, columns)),
      );
    } catch {
      // Column preferences remain optional when local storage is unavailable.
    }
  }

  private normalize(finder: FinderKind, values: readonly unknown[]): FinderColumnKey[] {
    const selected = new Set(values.filter((value): value is string => typeof value === 'string'));
    return finderColumns[finder]
      .filter((column) => column.required || selected.has(column.key))
      .map((column) => column.key);
  }
}
