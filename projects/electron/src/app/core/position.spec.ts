import { positionBadgeClass, positionGroup, positionValueClass } from './position';

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
    expect(positionValueClass(position)).toBe(`position-value position-${group}`);
    expect(positionBadgeClass(position)).toBe(
      `data-badge position-badge position-value position-${group}`,
    );
  });
});
