import { TestBed } from '@angular/core/testing';
import { FinderColumnPreferences, finderColumnPreferenceKey } from './finder-column-preferences';
import {
  defaultFinderColumns,
  finderColumns,
  isFinderSortVisible,
  toFinderColumnVisibility,
  fromFinderColumnVisibility,
} from './finder-columns';

describe('finder columns', () => {
  beforeEach(() => window.localStorage.clear());

  it('defines all existing columns and visible birth dates in canonical order', () => {
    expect(defaultFinderColumns('players')).toEqual([
      'name',
      'database',
      'originalId',
      'version',
      'nationality',
      'teams',
      'positions',
      'birthDate',
      'age',
      'overall',
      'potential',
      'bestRating',
    ]);
    expect(defaultFinderColumns('referees')).toEqual([
      'name',
      'database',
      'originalId',
      'version',
      'nationality',
      'leagues',
      'birthDate',
      'age',
      'height',
      'real',
    ]);
    expect(Object.values(finderColumns).every((columns) => columns[0]?.required)).toBe(true);
  });

  it('converts staged visibility back to canonical order and keeps Name required', () => {
    const visibility = toFinderColumnVisibility(['age', 'name', 'database']);
    visibility.name = false;

    expect(fromFinderColumnVisibility(finderColumns.players, visibility)).toEqual([
      'name',
      'database',
      'age',
    ]);
    expect(isFinderSortVisible(finderColumns.players, ['name', 'age'], 'age')).toBe(true);
    expect(isFinderSortVisible(finderColumns.players, ['name', 'age'], 'version')).toBe(false);
  });

  it('normalizes and persists independent finder preferences', () => {
    const preferences = TestBed.inject(FinderColumnPreferences);
    window.localStorage.setItem(
      finderColumnPreferenceKey('teams'),
      JSON.stringify(['defence', 'unknown', 'name', 'defence', 42]),
    );

    expect(preferences.load('teams')).toEqual(['name', 'defence']);
    expect(preferences.load('leagues')).toEqual(defaultFinderColumns('leagues'));

    preferences.save('players', ['birthDate', 'name', 'birthDate']);
    expect(
      JSON.parse(window.localStorage.getItem(finderColumnPreferenceKey('players')) ?? ''),
    ).toEqual(['name', 'birthDate']);
    expect(window.localStorage.getItem(finderColumnPreferenceKey('referees'))).toBeNull();
  });

  it('falls back to defaults for malformed or unavailable storage', () => {
    const preferences = TestBed.inject(FinderColumnPreferences);
    window.localStorage.setItem(finderColumnPreferenceKey('stadiums'), '{invalid');
    expect(preferences.load('stadiums')).toEqual(defaultFinderColumns('stadiums'));

    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    expect(preferences.load('players')).toEqual(defaultFinderColumns('players'));
    getItem.mockRestore();

    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    expect(() => preferences.save('players', ['name'])).not.toThrow();
    setItem.mockRestore();
  });
});
