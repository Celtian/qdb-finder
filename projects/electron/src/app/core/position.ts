import { scoreValueClass } from './attribute-value';

export type PositionGroup = 'attacker' | 'midfielder' | 'defender' | 'goalkeeper';

export interface PositionMatrixSlot {
  readonly position: string;
  readonly column: number;
}

export interface PositionMatrixRow {
  readonly key: string;
  readonly slots: readonly PositionMatrixSlot[];
}

export interface PositionRatingTile extends PositionMatrixSlot {
  readonly value: number;
  readonly className: string;
}

export interface PositionRatingRow {
  readonly key: string;
  readonly tiles: readonly PositionRatingTile[];
}

export const POSITION_MATRIX_ROWS = [
  {
    key: 'strikers',
    slots: [
      { position: 'LS', column: 2 },
      { position: 'ST', column: 3 },
      { position: 'RS', column: 4 },
    ],
  },
  {
    key: 'forwards',
    slots: [
      { position: 'LW', column: 1 },
      { position: 'LF', column: 2 },
      { position: 'CF', column: 3 },
      { position: 'RF', column: 4 },
      { position: 'RW', column: 5 },
    ],
  },
  {
    key: 'attacking-midfielders',
    slots: [
      { position: 'LAM', column: 2 },
      { position: 'CAM', column: 3 },
      { position: 'RAM', column: 4 },
    ],
  },
  {
    key: 'midfielders',
    slots: [
      { position: 'LM', column: 1 },
      { position: 'LCM', column: 2 },
      { position: 'CM', column: 3 },
      { position: 'RCM', column: 4 },
      { position: 'RM', column: 5 },
    ],
  },
  {
    key: 'defensive-midfielders',
    slots: [
      { position: 'LWB', column: 1 },
      { position: 'LDM', column: 2 },
      { position: 'CDM', column: 3 },
      { position: 'RDM', column: 4 },
      { position: 'RWB', column: 5 },
    ],
  },
  {
    key: 'defenders',
    slots: [
      { position: 'LB', column: 1 },
      { position: 'LCB', column: 2 },
      { position: 'CB', column: 3 },
      { position: 'RCB', column: 4 },
      { position: 'RB', column: 5 },
    ],
  },
  { key: 'sweeper', slots: [{ position: 'SW', column: 3 }] },
  { key: 'goalkeeper', slots: [{ position: 'GK', column: 3 }] },
] as const satisfies readonly PositionMatrixRow[];

const midfielders = new Set([
  'CDM',
  'LDM',
  'RDM',
  'CM',
  'LCM',
  'RCM',
  'CAM',
  'LAM',
  'RAM',
  'LM',
  'RM',
]);
const defenders = new Set(['CB', 'LCB', 'RCB', 'LB', 'LWB', 'RB', 'RWB', 'SW']);

export const positionGroup = (position: string): PositionGroup => {
  const normalized = position.toUpperCase();
  if (normalized === 'GK') return 'goalkeeper';
  if (defenders.has(normalized)) return 'defender';
  if (midfielders.has(normalized)) return 'midfielder';
  return 'attacker';
};

export const positionValueClass = (position: string): string =>
  `position-value position-${positionGroup(position)}`;

export const positionBadgeClass = (position: string): string =>
  `data-badge position-badge ${positionValueClass(position)}`;

export const positionRatingRows = (
  ratings: Readonly<Record<string, number>>,
): readonly PositionRatingRow[] =>
  POSITION_MATRIX_ROWS.map((row) => ({
    key: row.key,
    tiles: row.slots.flatMap((slot) => {
      const value = ratings[slot.position];
      return value === undefined ? [] : [{ ...slot, value, className: scoreValueClass(value) }];
    }),
  }));
