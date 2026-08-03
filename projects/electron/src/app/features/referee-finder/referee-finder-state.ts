import { formatDateOnly } from '../../core/player-profile-value';
import type { Gender, RefereeEditionRow, RefereeSearchRequest } from '../../core/qdb-contracts';

export type RefereeFacet = 'nationality' | 'league';
export type AvailabilityFilter = 'all' | 'real' | 'generic';
export type GenderFilter = 'all' | Gender;

export interface FilterDisplay {
  key: string;
  label: string;
  countryCode?: string;
}

export interface RefereeDisplay extends RefereeEditionRow {
  birthDateLabel: string;
  leagueText: string;
}

export const refereeDisplay = (row: RefereeEditionRow): RefereeDisplay => ({
  ...row,
  birthDateLabel: formatDateOnly(row.birthDate),
  leagueText: row.leagues.join(', '),
});

export const countRefereeFilters = (request: RefereeSearchRequest): number =>
  [
    request.databaseIds.length > 0,
    request.versions.length > 0,
    request.gender !== undefined,
    request.nationalityIds.length > 0,
    request.leagueKeys.length > 0,
    Boolean(request.leagueEdition),
    request.isReal !== undefined,
    Object.keys(request.age).length > 0,
  ].filter(Boolean).length;

export const validRefereeVersion = (value: string | null): number | undefined => {
  const version = Number(value);
  return Number.isInteger(version) && version >= 11 && version <= 23 ? version : undefined;
};

export const validRefereeId = (value: string | null): number | undefined => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};
