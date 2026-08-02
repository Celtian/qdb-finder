import {
  POSITION_MATRIX_ROWS,
  positionBadgeClass,
  positionGroup,
  positionRatingRows,
  positionValueClass,
} from './position';

describe('position styling', () => {
  it.each([
    ['ST', 'attacker'],
    ['RW', 'attacker'],
    ['CAM', 'midfielder'],
    ['RAM', 'midfielder'],
    ['CDM', 'midfielder'],
    ['CB', 'defender'],
    ['LWB', 'defender'],
    ['SW', 'defender'],
    ['GK', 'goalkeeper'],
  ] as const)('classifies %s as a %s', (position, group) => {
    expect(positionGroup(position)).toBe(group);
    expect(positionValueClass(position)).toContain(`bg-position-${group}`);
    expect(positionValueClass(position)).toContain(`text-on-position-${group}`);
    expect(positionBadgeClass(position)).toContain('inline-flex');
  });

  it('defines every position once in pitch order', () => {
    const positions = POSITION_MATRIX_ROWS.map((row) => row.slots.map((slot) => slot.position));
    const flattened = positions.flat();

    expect(positions).toEqual([
      ['LS', 'ST', 'RS'],
      ['LW', 'LF', 'CF', 'RF', 'RW'],
      ['LAM', 'CAM', 'RAM'],
      ['LM', 'LCM', 'CM', 'RCM', 'RM'],
      ['LWB', 'LDM', 'CDM', 'RDM', 'RWB'],
      ['LB', 'LCB', 'CB', 'RCB', 'RB'],
      ['SW'],
      ['GK'],
    ]);
    expect(new Set(flattened).size).toBe(28);
    expect(flattened).toHaveLength(28);
  });

  it('keeps sparse ratings in their pitch rows and columns', () => {
    const rows = positionRatingRows({ ST: 82, SW: 71, GK: 65 });

    expect(rows).toHaveLength(8);
    expect(rows.map((row) => row.tiles.map((tile) => tile.position))).toEqual([
      ['ST'],
      [],
      [],
      [],
      [],
      [],
      ['SW'],
      ['GK'],
    ]);
    expect(rows[0]?.tiles[0]).toEqual({
      position: 'ST',
      column: 3,
      value: 82,
      className: 'bg-score-green text-on-score-green',
    });
    expect(rows[6]?.tiles[0]).toEqual({
      position: 'SW',
      column: 3,
      value: 71,
      className: 'bg-score-lime text-on-score-lime',
    });
    expect(rows[7]?.tiles[0]?.className).toBe('bg-score-yellow text-on-score-yellow');
  });
});
