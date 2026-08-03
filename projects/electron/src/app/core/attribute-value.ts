export type ScoreValueBand = 'red' | 'orange' | 'yellow' | 'lime' | 'green';

const scoreValueClasses: Readonly<Record<ScoreValueBand, string>> = {
  red: 'bg-score-red text-on-score-red',
  orange: 'bg-score-orange text-on-score-orange',
  yellow: 'bg-score-yellow text-on-score-yellow',
  lime: 'bg-score-lime text-on-score-lime',
  green: 'bg-score-green text-on-score-green',
};

const badgeClasses =
  'inline-flex min-h-6 items-center justify-center rounded-full border-0 px-2 py-micro text-xs leading-tight font-bold whitespace-nowrap';

export const scoreValueBand = (value: number): ScoreValueBand => {
  if (value <= 50) return 'red';
  if (value <= 60) return 'orange';
  if (value <= 70) return 'yellow';
  if (value <= 80) return 'lime';
  return 'green';
};

export const scoreValueClass = (value: number): string => scoreValueClasses[scoreValueBand(value)];

export const scoreBadgeClass = (value: number): string =>
  `${badgeClasses} min-w-9 ${scoreValueClass(value)}`;
