import { TestBed } from '@angular/core/testing';
import {
  FinderPreferences,
  finderColumnPreferenceKey,
  finderFilterPreferenceKey,
} from './finder-preferences';
import {
  defaultFinderColumnPreference,
  defaultFinderColumns,
  finderColumns,
  isFinderSortVisible,
  toFinderColumnVisibility,
  fromFinderColumnVisibility,
} from './finder-columns';

describe('finder columns', () => {
  beforeEach(() => window.localStorage.clear());

  it('defines lean defaults separately from all columns in canonical order', () => {
    expect(defaultFinderColumnPreference('teams')).toEqual({
      version: 2,
      order: finderColumns.teams.map(({ key }) => key),
      visible: defaultFinderColumns('teams'),
    });
    expect(defaultFinderColumns('players')).toEqual([
      'name',
      'originalId',
      'version',
      'nationality',
      'positions',
      'birthDate',
      'height',
      'weight',
      'preferredFoot',
      'overall',
      'potential',
      'bestRating',
    ]);
    expect(defaultFinderColumns('referees')).toEqual([
      'name',
      'originalId',
      'version',
      'nationality',
      'birthDate',
      'height',
      'weight',
      'real',
    ]);
    expect(defaultFinderColumns('teams')).toEqual([
      'name',
      'originalId',
      'version',
      'country',
      'league',
      'squadSize',
      'overall',
      'attack',
      'midfield',
      'defence',
    ]);
    expect(defaultFinderColumns('leagues')).toEqual([
      'name',
      'originalId',
      'version',
      'country',
      'level',
      'teamCount',
      'playerCount',
    ]);
    expect(defaultFinderColumns('stadiums')).toEqual([
      'name',
      'originalId',
      'version',
      'country',
      'teams',
      'capacity',
      'built',
      'pitch',
      'licensed',
    ]);
    for (const columns of Object.values(finderColumns)) {
      expect(columns[1]?.key).toBe('originalId');
    }
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

  it('migrates legacy arrays and persists ordered finder preferences independently', () => {
    const preferences = TestBed.inject(FinderPreferences);
    window.localStorage.setItem(
      finderColumnPreferenceKey('teams'),
      JSON.stringify(['defence', 'unknown', 'name', 'defence', 42]),
    );

    expect(preferences.loadColumns('teams')).toEqual(['name', 'defence']);
    expect(preferences.loadColumnPreference('teams')).toEqual({
      version: 2,
      order: finderColumns.teams.map(({ key }) => key),
      visible: ['name', 'defence'],
    });
    expect(preferences.loadColumns('leagues')).toEqual(defaultFinderColumns('leagues'));

    preferences.saveColumnPreference('players', {
      version: 2,
      order: [
        'birthDate',
        'name',
        ...defaultFinderColumnPreference('players').order.filter(
          (column) => column !== 'birthDate' && column !== 'name',
        ),
      ],
      visible: ['birthDate', 'name', 'birthDate'],
    });
    expect(
      JSON.parse(window.localStorage.getItem(finderColumnPreferenceKey('players')) ?? ''),
    ).toEqual({
      version: 2,
      order: [
        'birthDate',
        'name',
        'originalId',
        'database',
        'version',
        'nationality',
        'teams',
        'positions',
        'contractValidUntil',
        'age',
        'height',
        'weight',
        'preferredFoot',
        'overall',
        'potential',
        'bestRating',
      ],
      visible: ['birthDate', 'name'],
    });
    expect(preferences.loadColumns('players')).toEqual(['birthDate', 'name']);
    expect(window.localStorage.getItem(finderColumnPreferenceKey('referees'))).toBeNull();
  });

  it('falls back to defaults for malformed or unavailable storage', () => {
    const preferences = TestBed.inject(FinderPreferences);
    window.localStorage.setItem(finderColumnPreferenceKey('stadiums'), '{invalid');
    expect(preferences.loadColumns('stadiums')).toEqual(defaultFinderColumns('stadiums'));

    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    expect(preferences.loadColumns('players')).toEqual(defaultFinderColumns('players'));
    getItem.mockRestore();

    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable');
    });
    expect(() => preferences.saveColumns('players', ['name'])).not.toThrow();
    setItem.mockRestore();
  });

  it('round-trips validated filter state and display metadata for every finder', () => {
    const preferences = TestBed.inject(FinderPreferences);
    preferences.saveFilters('players', {
      databaseIds: ['custom'],
      versions: [23],
      gender: 'women',
      nationalities: ['France'],
      teams: ['1'],
      leagues: ['2'],
      positions: ['ST'],
      age: { min: 20 },
      overall: { max: 90 },
      potential: {},
      labels: {
        nationalities: { France: 'France' },
        teams: { '1': 'Paris FC' },
        leagues: { '2': 'Division 1' },
      },
      nationalityCodes: { France: 'fr' },
    });
    preferences.saveFilters('teams', {
      databaseIds: [],
      versions: [22],
      leagueKeys: ['league'],
      countryIds: [14],
      overall: { min: 70 },
      attack: {},
      midfield: {},
      defence: {},
      labels: {
        league: { league: { key: 'league', label: 'League' } },
        country: { '14': { key: '14', label: 'England', countryCode: 'gb-eng' } },
      },
    });
    preferences.saveFilters('leagues', {
      databaseIds: [],
      versions: [],
      countryIds: [14],
      levels: [1],
      countryLabels: { '14': { key: '14', label: 'England' } },
    });
    preferences.saveFilters('referees', {
      databaseIds: [],
      versions: [],
      gender: 'men',
      nationalityIds: [14],
      leagueKeys: ['league'],
      age: { max: 50 },
      isReal: true,
      labels: { nationality: {}, league: {} },
    });
    preferences.saveFilters('stadiums', {
      databaseIds: [],
      versions: [],
      countryIds: [14],
      teamKeys: ['team'],
      capacity: { min: 20_000 },
      isLicensed: false,
      labels: { country: {}, team: {} },
    });

    expect(preferences.loadFilters('players')).toMatchObject({
      gender: 'women',
      positions: ['ST'],
    });
    expect(preferences.loadFilters('teams').labels.country['14']?.label).toBe('England');
    expect(preferences.loadFilters('leagues').levels).toEqual([1]);
    expect(preferences.loadFilters('referees').isReal).toBe(true);
    expect(preferences.loadFilters('stadiums')).toMatchObject({ isLicensed: false });
  });

  it('normalizes malformed filter storage and resets filter and column keys independently', () => {
    const preferences = TestBed.inject(FinderPreferences);
    window.localStorage.setItem(
      finderFilterPreferenceKey('players'),
      JSON.stringify({
        version: 1,
        filters: {
          databaseIds: ['built-in', 3, 'built-in'],
          versions: [23, '22', Number.NaN],
          gender: 'unknown',
          age: { min: 'young', max: 30 },
        },
      }),
    );
    window.localStorage.setItem(finderColumnPreferenceKey('players'), JSON.stringify(['name']));
    window.localStorage.setItem(finderFilterPreferenceKey('teams'), '{}');

    expect(preferences.loadFilters('players')).toMatchObject({
      databaseIds: ['built-in'],
      versions: [23],
      age: { max: 30 },
    });
    expect(preferences.loadFilters('players').gender).toBeUndefined();
    expect(preferences.loadFilters('teams').leagueKeys).toEqual([]);

    preferences.resetFilters();
    expect(window.localStorage.getItem(finderFilterPreferenceKey('players'))).toBeNull();
    expect(window.localStorage.getItem(finderColumnPreferenceKey('players'))).not.toBeNull();

    preferences.resetAll();
    expect(window.localStorage.getItem(finderColumnPreferenceKey('players'))).toBeNull();
  });
});
