import {
  PLAYER_ATTRIBUTE_GROUPS,
  normalizeInternationalReputation,
  playerAttributeGroups,
} from './player-attribute';

describe('player attribute presentation', () => {
  it('groups and labels every normalized player attribute in display order', () => {
    const attributes = Object.fromEntries(
      PLAYER_ATTRIBUTE_GROUPS.flatMap((group) =>
        group.attributes.map((attribute) => [attribute.key, 75]),
      ),
    );
    const groups = playerAttributeGroups(attributes);

    expect(
      groups.map((group) => ({
        label: group.label,
        attributes: group.attributes.map((attribute) => attribute.label),
      })),
    ).toEqual([
      {
        label: 'Attacking',
        attributes: ['Crossing', 'Finishing', 'Heading accuracy', 'Short passing', 'Volleys'],
      },
      {
        label: 'Skill',
        attributes: ['Dribbling', 'Curve', 'FK accuracy', 'Long passing', 'Ball control'],
      },
      {
        label: 'Movement',
        attributes: ['Acceleration', 'Sprint speed', 'Agility', 'Reactions', 'Balance'],
      },
      {
        label: 'Power',
        attributes: ['Shot power', 'Jumping', 'Stamina', 'Strength', 'Long shots'],
      },
      {
        label: 'Mentality',
        attributes: ['Aggression', 'Interceptions', 'Positioning', 'Vision', 'Penalties'],
      },
      {
        label: 'Defending',
        attributes: ['Marking', 'Standing tackle', 'Sliding tackle'],
      },
      {
        label: 'Goalkeeping',
        attributes: ['GK diving', 'GK handling', 'GK kicking', 'GK positioning', 'GK reflexes'],
      },
    ]);
    expect(
      groups.every((group) =>
        group.attributes.every((item) => item.className === 'score-value score-lime'),
      ),
    ).toBe(true);
  });

  it('preserves unexpected attributes in a labeled Other group', () => {
    const groups = playerAttributeGroups({
      finishing: 80,
      defensive_awareness: 74,
      zetaSkill: 55,
    });
    const other = groups.at(-1);

    expect(other).toEqual({
      key: 'other',
      label: 'Other',
      attributes: [
        {
          key: 'defensive_awareness',
          label: 'Defensive awareness',
          value: 74,
          className: 'score-value score-lime',
        },
        {
          key: 'zetaSkill',
          label: 'Zeta skill',
          value: 55,
          className: 'score-value score-orange',
        },
      ],
    });
  });

  it.each([
    [undefined, null],
    [null, null],
    ['', null],
    ['invalid', null],
    [0, 1],
    [1.4, 1],
    [2.6, 3],
    ['4', 4],
    [7, 5],
  ] as const)('normalizes international reputation %s to %s', (value, expected) => {
    expect(normalizeInternationalReputation(value)).toBe(expected);
  });
});
