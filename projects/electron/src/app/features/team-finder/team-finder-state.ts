import type { ParamMap } from '@angular/router';

import { scoreBadgeClass } from '../../core/attribute-value';
import type { TeamFinderFilters } from '../../core/finder-preferences';
import {
  type TeamEditionRow,
  type TeamSearchRequest,
  defaultTeamSearchRequest,
} from '../../core/qdb-contracts';

export interface FilterDisplay {
  key: string;
  label: string;
  countryCode?: string;
}

export type TeamFacet = 'league' | 'country';
export type NationalFilter = 'all' | 'yes' | 'no';

export interface TeamDisplay extends TeamEditionRow {
  overallClass: string;
  attackClass: string;
  midfieldClass: string;
  defenceClass: string;
  budgetLabel: string;
  national: string;
}

const scoreClass = (value: number | null): string => (value === null ? '' : scoreBadgeClass(value));

export const teamDisplay = (row: TeamEditionRow): TeamDisplay => ({
  ...row,
  overallClass: scoreClass(row.overall),
  attackClass: scoreClass(row.attack),
  midfieldClass: scoreClass(row.midfield),
  defenceClass: scoreClass(row.defence),
  budgetLabel: row.budget === null ? '—' : row.budget.toLocaleString(),
  national: row.isNational ? 'Yes' : 'No',
});

const validVersion = (value: string | null): number | undefined => {
  const version = Number(value);
  return Number.isInteger(version) && version >= 11 && version <= 23 ? version : undefined;
};

const validId = (value: string | null): number | undefined => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

export const cloneTeamRequest = (value: TeamSearchRequest): TeamSearchRequest => ({
  ...value,
  databaseIds: [...value.databaseIds],
  versions: [...value.versions],
  leagueKeys: [...value.leagueKeys],
  countryIds: [...value.countryIds],
  overall: { ...value.overall },
  attack: { ...value.attack },
  midfield: { ...value.midfield },
  defence: { ...value.defence },
});

export const initialTeamContextRequest = (params: ParamMap): TeamSearchRequest | undefined => {
  const request = defaultTeamSearchRequest();
  const databaseId = params.get('databaseId') ?? 'built-in';
  const version = validVersion(params.get('version'));
  const playerId = validId(params.get('playerId'));
  const leagueId = validId(params.get('leagueId'));
  const stadiumId = validId(params.get('stadiumId'));
  const contextCount = [playerId, leagueId, stadiumId].filter(
    (value) => value !== undefined,
  ).length;
  if (!version || contextCount !== 1) return undefined;
  if (playerId)
    return {
      ...request,
      databaseIds: [databaseId],
      versions: [version],
      playerEdition: { databaseId, version, playerId },
    };
  if (leagueId)
    return {
      ...request,
      databaseIds: [databaseId],
      versions: [version],
      leagueEdition: { databaseId, version, leagueId },
    };
  if (stadiumId)
    return {
      ...request,
      databaseIds: [databaseId],
      versions: [version],
      stadiumEdition: { databaseId, version, stadiumId },
    };
  return undefined;
};

export const restoreTeamRequest = (filters: TeamFinderFilters): TeamSearchRequest => ({
  ...defaultTeamSearchRequest(),
  databaseIds: [...filters.databaseIds],
  versions: [...filters.versions],
  leagueKeys: [...filters.leagueKeys],
  countryIds: [...filters.countryIds],
  isNational: filters.isNational,
  overall: { ...filters.overall },
  attack: { ...filters.attack },
  midfield: { ...filters.midfield },
  defence: { ...filters.defence },
});

export const countTeamFilters = (request: TeamSearchRequest): number =>
  [
    request.databaseIds.length > 0,
    request.versions.length > 0,
    request.leagueKeys.length > 0,
    request.countryIds.length > 0,
    request.isNational !== undefined,
    Boolean(request.playerEdition || request.leagueEdition || request.stadiumEdition),
    Object.keys(request.overall).length > 0,
    Object.keys(request.attack).length > 0,
    Object.keys(request.midfield).length > 0,
    Object.keys(request.defence).length > 0,
  ].filter(Boolean).length;

export const teamFilterPreferences = (
  request: TeamSearchRequest,
  labels: TeamFinderFilters['labels'],
): TeamFinderFilters => ({
  databaseIds: [...request.databaseIds],
  versions: [...request.versions],
  leagueKeys: [...request.leagueKeys],
  countryIds: [...request.countryIds],
  isNational: request.isNational,
  overall: { ...request.overall },
  attack: { ...request.attack },
  midfield: { ...request.midfield },
  defence: { ...request.defence },
  labels: structuredClone(labels),
});
