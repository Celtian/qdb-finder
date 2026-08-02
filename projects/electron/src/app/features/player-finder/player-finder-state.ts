import type { ParamMap } from '@angular/router';

import { scoreBadgeClass } from '../../core/attribute-value';
import type { PlayerFinderFilters } from '../../core/finder-preferences';
import {
  formatDateOnly,
  preferredFootLabel as formatPreferredFoot,
} from '../../core/player-profile-value';
import { positionBadgeClass } from '../../core/position';
import {
  type Gender,
  type PlayerSearchRow,
  type SearchRequest,
  defaultSearchRequest,
} from '../../core/qdb-contracts';

export type ExactFilterField = 'nationalities' | 'teams' | 'leagues';
export type GenderFilter = 'all' | Gender;

export interface FilterDisplay {
  key: string;
  label: string;
  nationalityCode?: string;
}

export interface PositionDisplay {
  value: string;
  className: string;
}

export interface PlayerSearchDisplay extends PlayerSearchRow {
  teamsLabel: string;
  positionDisplays: PositionDisplay[];
  overallClass: string;
  potentialClass: string;
  bestRatingClass: string;
  birthDateLabel: string;
  preferredFootLabel: string;
}

export const PLAYER_POSITIONS = [
  'GK',
  'RB',
  'CB',
  'LB',
  'CDM',
  'CM',
  'CAM',
  'RM',
  'LM',
  'RW',
  'LW',
  'CF',
  'ST',
];

export const PLAYER_POSITION_OPTIONS: PositionDisplay[] = PLAYER_POSITIONS.map((value) => ({
  value,
  className: positionBadgeClass(value),
}));

export const playerSearchDisplay = (row: PlayerSearchRow): PlayerSearchDisplay => ({
  ...row,
  teamsLabel: row.teams.join(', ') || 'Free agent',
  positionDisplays: row.positions.map((value) => ({
    value,
    className: positionBadgeClass(value),
  })),
  overallClass: scoreBadgeClass(row.overall),
  potentialClass: scoreBadgeClass(row.potential),
  bestRatingClass: `min-w-rating justify-center whitespace-nowrap ${positionBadgeClass(row.bestPosition)}`,
  birthDateLabel: formatDateOnly(row.birthDate),
  preferredFootLabel: formatPreferredFoot(row.preferredFoot),
});

const validVersion = (value: string | null): number | undefined => {
  const version = Number(value);
  return Number.isInteger(version) && version >= 11 && version <= 23 ? version : undefined;
};

const validId = (value: string | null): number | undefined => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

export const clonePlayerRequest = (value: SearchRequest): SearchRequest => ({
  ...value,
  databaseIds: [...value.databaseIds],
  versions: [...value.versions],
  nationalities: [...value.nationalities],
  teams: [...value.teams],
  leagues: [...value.leagues],
  positions: [...value.positions],
  age: { ...value.age },
  overall: { ...value.overall },
  potential: { ...value.potential },
});

export const initialPlayerContextRequest = (params: ParamMap): SearchRequest | undefined => {
  const request = defaultSearchRequest();
  const databaseId = params.get('databaseId') ?? 'built-in';
  const version = validVersion(params.get('version'));
  const teamId = validId(params.get('teamId'));
  const leagueId = validId(params.get('leagueId'));
  if (!version || Boolean(teamId) === Boolean(leagueId)) return undefined;
  if (teamId)
    return {
      ...request,
      databaseIds: [databaseId],
      versions: [version],
      teamEdition: { databaseId, version, teamId },
    };
  if (leagueId)
    return {
      ...request,
      databaseIds: [databaseId],
      versions: [version],
      leagueEdition: { databaseId, version, leagueId },
    };
  return undefined;
};

export const restorePlayerRequest = (filters: PlayerFinderFilters): SearchRequest => ({
  ...defaultSearchRequest(),
  databaseIds: [...filters.databaseIds],
  versions: [...filters.versions],
  gender: filters.gender,
  nationalities: [...filters.nationalities],
  teams: [...filters.teams],
  leagues: [...filters.leagues],
  positions: [...filters.positions],
  age: { ...filters.age },
  overall: { ...filters.overall },
  potential: { ...filters.potential },
});

export const countPlayerFilters = (value: SearchRequest): number =>
  [
    value.databaseIds.length > 0,
    value.versions.length > 0,
    value.gender !== undefined,
    value.nationalities.length > 0,
    value.teams.length > 0,
    value.leagues.length > 0,
    value.positions.length > 0,
    Boolean(value.teamEdition || value.leagueEdition),
    Object.keys(value.age).length > 0,
    Object.keys(value.overall).length > 0,
    Object.keys(value.potential).length > 0,
  ].filter(Boolean).length;

export const playerFilterPreferences = (
  request: SearchRequest,
  labels: PlayerFinderFilters['labels'],
  nationalityCodes: PlayerFinderFilters['nationalityCodes'],
): PlayerFinderFilters => ({
  databaseIds: [...request.databaseIds],
  versions: [...request.versions],
  gender: request.gender,
  nationalities: [...request.nationalities],
  teams: [...request.teams],
  leagues: [...request.leagues],
  positions: [...request.positions],
  age: { ...request.age },
  overall: { ...request.overall },
  potential: { ...request.potential },
  labels: structuredClone(labels),
  nationalityCodes: { ...nationalityCodes },
});
