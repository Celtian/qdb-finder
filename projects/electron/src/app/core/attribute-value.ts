export type ScoreValueBand = 'red' | 'orange' | 'yellow' | 'lime' | 'green';

export const scoreValueBand = (value: number): ScoreValueBand => {
  if (value <= 50) return 'red';
  if (value <= 60) return 'orange';
  if (value <= 70) return 'yellow';
  if (value <= 80) return 'lime';
  return 'green';
};

export const scoreValueClass = (value: number): string =>
  `score-value score-${scoreValueBand(value)}`;

export const scoreBadgeClass = (value: number): string =>
  `data-badge score-badge ${scoreValueClass(value)}`;
