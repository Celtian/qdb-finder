import { scoreValueClass } from './attribute-value';

export interface PlayerAttributeDefinition {
  readonly key: string;
  readonly label: string;
}

export interface PlayerAttributeGroupDefinition {
  readonly key: string;
  readonly label: string;
  readonly attributes: readonly PlayerAttributeDefinition[];
}

export interface PlayerAttributeTile extends PlayerAttributeDefinition {
  readonly value: number;
  readonly className: string;
}

export interface PlayerAttributeGroup {
  readonly key: string;
  readonly label: string;
  readonly attributes: readonly PlayerAttributeTile[];
}

export const PLAYER_ATTRIBUTE_GROUPS = [
  {
    key: 'attacking',
    label: 'Attacking',
    attributes: [
      { key: 'crossing', label: 'Crossing' },
      { key: 'finishing', label: 'Finishing' },
      { key: 'headingaccuracy', label: 'Heading accuracy' },
      { key: 'shortpassing', label: 'Short passing' },
      { key: 'volleys', label: 'Volleys' },
    ],
  },
  {
    key: 'skill',
    label: 'Skill',
    attributes: [
      { key: 'dribbling', label: 'Dribbling' },
      { key: 'curve', label: 'Curve' },
      { key: 'freekickaccuracy', label: 'FK accuracy' },
      { key: 'longpassing', label: 'Long passing' },
      { key: 'ballcontrol', label: 'Ball control' },
    ],
  },
  {
    key: 'movement',
    label: 'Movement',
    attributes: [
      { key: 'acceleration', label: 'Acceleration' },
      { key: 'sprintspeed', label: 'Sprint speed' },
      { key: 'agility', label: 'Agility' },
      { key: 'reactions', label: 'Reactions' },
      { key: 'balance', label: 'Balance' },
    ],
  },
  {
    key: 'power',
    label: 'Power',
    attributes: [
      { key: 'shotpower', label: 'Shot power' },
      { key: 'jumping', label: 'Jumping' },
      { key: 'stamina', label: 'Stamina' },
      { key: 'strength', label: 'Strength' },
      { key: 'longshots', label: 'Long shots' },
    ],
  },
  {
    key: 'mentality',
    label: 'Mentality',
    attributes: [
      { key: 'aggression', label: 'Aggression' },
      { key: 'interceptions', label: 'Interceptions' },
      { key: 'positioning', label: 'Positioning' },
      { key: 'vision', label: 'Vision' },
      { key: 'penalties', label: 'Penalties' },
    ],
  },
  {
    key: 'defending',
    label: 'Defending',
    attributes: [
      { key: 'marking', label: 'Marking' },
      { key: 'standingtackle', label: 'Standing tackle' },
      { key: 'slidingtackle', label: 'Sliding tackle' },
    ],
  },
  {
    key: 'goalkeeping',
    label: 'Goalkeeping',
    attributes: [
      { key: 'gkdiving', label: 'GK diving' },
      { key: 'gkhandling', label: 'GK handling' },
      { key: 'gkkicking', label: 'GK kicking' },
      { key: 'gkpositioning', label: 'GK positioning' },
      { key: 'gkreflexes', label: 'GK reflexes' },
    ],
  },
] as const satisfies readonly PlayerAttributeGroupDefinition[];

const groupedAttributeKeys = new Set<string>(
  PLAYER_ATTRIBUTE_GROUPS.flatMap((group) => group.attributes.map((attribute) => attribute.key)),
);

const humanizeAttributeKey = (key: string): string => {
  const words = key
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLocaleLowerCase('en');
  return words ? `${words[0].toLocaleUpperCase('en')}${words.slice(1)}` : 'Attribute';
};

const attributeTile = (
  definition: PlayerAttributeDefinition,
  value: number,
): PlayerAttributeTile => ({
  ...definition,
  value,
  className: scoreValueClass(value),
});

export const playerAttributeGroups = (
  attributes: Readonly<Record<string, number>>,
): readonly PlayerAttributeGroup[] => {
  const groups: PlayerAttributeGroup[] = PLAYER_ATTRIBUTE_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    attributes: group.attributes.flatMap((definition) => {
      const value = attributes[definition.key];
      return value === undefined ? [] : [attributeTile(definition, value)];
    }),
  }));
  const otherAttributes = Object.entries(attributes)
    .filter(([key]) => !groupedAttributeKeys.has(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => attributeTile({ key, label: humanizeAttributeKey(key) }, value));

  return otherAttributes.length
    ? [...groups, { key: 'other', label: 'Other', attributes: otherAttributes }]
    : groups;
};

export const normalizeInternationalReputation = (value: unknown): number | null => {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '')
    return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(5, Math.max(1, Math.round(numeric))) : null;
};
