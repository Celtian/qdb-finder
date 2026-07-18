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

export const positionBadgeClass = (position: string): string =>
  `position-badge position-${positionGroup(position)}`;
