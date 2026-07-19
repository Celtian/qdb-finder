export type PositionGroup = 'attacker' | 'midfielder' | 'defender' | 'goalkeeper';

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
