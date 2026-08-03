import { scoreBadgeClass, scoreValueBand, scoreValueClass } from './attribute-value';

describe('score value styling', () => {
  it.each([
    [1, 'red'],
    [50, 'red'],
    [51, 'orange'],
    [60, 'orange'],
    [61, 'yellow'],
    [70, 'yellow'],
    [71, 'lime'],
    [80, 'lime'],
    [81, 'green'],
    [99, 'green'],
  ] as const)('classifies %i as %s', (value, band) => {
    expect(scoreValueBand(value)).toBe(band);
    expect(scoreValueClass(value)).toContain(`bg-score-${band}`);
    expect(scoreValueClass(value)).toContain(`text-on-score-${band}`);
    expect(scoreBadgeClass(value)).toContain('inline-flex');
    expect(scoreBadgeClass(value)).toContain('min-w-9');
  });
});
