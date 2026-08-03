import type { StadiumEditionRow } from '../../core/qdb-contracts';

export type StadiumFacet = 'country' | 'team';
export type AvailabilityFilter = 'all' | 'licensed' | 'generic';

export interface FilterDisplay {
  key: string;
  label: string;
  countryCode?: string;
}

export interface StadiumDisplay extends StadiumEditionRow {
  pitch: string;
  licensed: string;
}

export const stadiumDisplay = (row: StadiumEditionRow): StadiumDisplay => ({
  ...row,
  pitch:
    row.pitchLengthMeters === null || row.pitchWidthMeters === null
      ? '—'
      : `${row.pitchLengthMeters} × ${row.pitchWidthMeters} m`,
  licensed: row.isLicensed === null ? '—' : row.isLicensed ? 'Yes' : 'No',
});

export const validStadiumVersion = (value: string | null): number | undefined => {
  const version = Number(value);
  return Number.isInteger(version) && version >= 11 && version <= 23 ? version : undefined;
};

export const validStadiumId = (value: string | null): number | undefined => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};
