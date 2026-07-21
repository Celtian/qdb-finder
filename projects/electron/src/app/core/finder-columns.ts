export type FinderKind = 'players' | 'teams' | 'leagues' | 'referees' | 'stadiums';

export type FinderColumnKey =
  | 'age'
  | 'attack'
  | 'bestRating'
  | 'birthDate'
  | 'built'
  | 'capacity'
  | 'country'
  | 'database'
  | 'defence'
  | 'height'
  | 'league'
  | 'leagues'
  | 'level'
  | 'licensed'
  | 'midfield'
  | 'name'
  | 'nationality'
  | 'originalId'
  | 'overall'
  | 'pitch'
  | 'playerCount'
  | 'positions'
  | 'potential'
  | 'preferredFoot'
  | 'real'
  | 'squadSize'
  | 'teamCount'
  | 'teams'
  | 'version'
  | 'weight';

export interface FinderColumnDefinition {
  key: FinderColumnKey;
  label: string;
  required: boolean;
  sortKey?: string;
}

export type FinderColumnVisibility = Record<FinderColumnKey, boolean>;

const defineColumn = (
  key: FinderColumnKey,
  label: string,
  sortKey?: string,
): FinderColumnDefinition => ({
  key,
  label,
  required: key === 'name',
  sortKey,
});

export const finderColumns: Record<FinderKind, readonly FinderColumnDefinition[]> = {
  players: [
    defineColumn('name', 'Player', 'name'),
    defineColumn('originalId', 'Original ID'),
    defineColumn('database', 'Database'),
    defineColumn('version', 'Edition', 'version'),
    defineColumn('nationality', 'Nationality'),
    defineColumn('teams', 'Teams'),
    defineColumn('positions', 'Positions'),
    defineColumn('birthDate', 'Birth date', 'birthDate'),
    defineColumn('age', 'Age', 'age'),
    defineColumn('height', 'Height', 'height'),
    defineColumn('weight', 'Weight', 'weight'),
    defineColumn('preferredFoot', 'Preferred foot', 'preferredFoot'),
    defineColumn('overall', 'OVR', 'overall'),
    defineColumn('potential', 'POT', 'potential'),
    defineColumn('bestRating', 'Best', 'bestRating'),
  ],
  teams: [
    defineColumn('name', 'Team', 'name'),
    defineColumn('originalId', 'Original ID'),
    defineColumn('database', 'Database'),
    defineColumn('version', 'Edition', 'version'),
    defineColumn('country', 'Country'),
    defineColumn('league', 'League', 'league'),
    defineColumn('squadSize', 'Squad', 'squadSize'),
    defineColumn('overall', 'OVR', 'overall'),
    defineColumn('attack', 'ATT', 'attack'),
    defineColumn('midfield', 'MID', 'midfield'),
    defineColumn('defence', 'DEF', 'defence'),
  ],
  leagues: [
    defineColumn('name', 'League', 'name'),
    defineColumn('originalId', 'Original ID'),
    defineColumn('database', 'Database'),
    defineColumn('version', 'Edition', 'version'),
    defineColumn('country', 'Country', 'country'),
    defineColumn('level', 'Tier', 'level'),
    defineColumn('teamCount', 'Teams', 'teamCount'),
    defineColumn('playerCount', 'Players', 'playerCount'),
  ],
  referees: [
    defineColumn('name', 'Referee', 'name'),
    defineColumn('originalId', 'Original ID'),
    defineColumn('database', 'Database'),
    defineColumn('version', 'Edition', 'version'),
    defineColumn('nationality', 'Nationality', 'nationality'),
    defineColumn('leagues', 'Leagues', 'leagueCount'),
    defineColumn('birthDate', 'Birth date', 'birthDate'),
    defineColumn('age', 'Age', 'age'),
    defineColumn('height', 'Height', 'height'),
    defineColumn('weight', 'Weight', 'weight'),
    defineColumn('real', 'Real'),
  ],
  stadiums: [
    defineColumn('name', 'Stadium', 'name'),
    defineColumn('originalId', 'Original ID'),
    defineColumn('database', 'Database'),
    defineColumn('version', 'Edition', 'version'),
    defineColumn('country', 'Country', 'country'),
    defineColumn('teams', 'Teams', 'teamCount'),
    defineColumn('capacity', 'Capacity', 'capacity'),
    defineColumn('built', 'Built', 'yearBuilt'),
    defineColumn('pitch', 'Pitch'),
    defineColumn('licensed', 'Licensed'),
  ],
};

const allColumnKeys = [
  ...new Set(Object.values(finderColumns).flatMap((columns) => columns.map(({ key }) => key))),
];

export const defaultFinderColumns = (finder: FinderKind): FinderColumnKey[] =>
  finderColumns[finder].map(({ key }) => key);

export const toFinderColumnVisibility = (
  visibleColumns: readonly FinderColumnKey[],
): FinderColumnVisibility => {
  const visible = new Set(visibleColumns);
  return Object.fromEntries(
    allColumnKeys.map((key) => [key, visible.has(key)]),
  ) as FinderColumnVisibility;
};

export const fromFinderColumnVisibility = (
  definitions: readonly FinderColumnDefinition[],
  visibility: FinderColumnVisibility,
): FinderColumnKey[] =>
  definitions
    .filter((column) => column.required || visibility[column.key])
    .map((column) => column.key);

export const isFinderSortVisible = (
  definitions: readonly FinderColumnDefinition[],
  visibleColumns: readonly FinderColumnKey[],
  sort: string,
): boolean => {
  const visible = new Set(visibleColumns);
  return definitions.some((column) => column.sortKey === sort && visible.has(column.key));
};
