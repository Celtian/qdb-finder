import { formatDateOnly, preferredFootLabel } from './player-profile-value';

describe('player profile value presentation', () => {
  it.each([
    ['1', 'Right'],
    [1, 'Right'],
    ['right', 'Right'],
    ['Right', 'Right'],
    ['2', 'Left'],
    [2, 'Left'],
    ['left', 'Left'],
    ['Left', 'Left'],
    [undefined, '—'],
    [null, '—'],
    ['', '—'],
    ['3', '—'],
  ] as const)('formats preferred foot %s as %s', (value, expected) => {
    expect(preferredFootLabel(value)).toBe(expected);
  });

  it.each([
    ['2000-09-07', '7 Sep 2000'],
    ['2024-02-29', '29 Feb 2024'],
    ['2022-12-01', '1 Dec 2022'],
  ] as const)('formats the date-only value %s without a timezone shift', (value, expected) => {
    expect(formatDateOnly(value)).toBe(expected);
  });

  it.each([undefined, null, '', 'not-a-date', '2023-02-29', '2022-13-01', '2022-01-00'])(
    'returns a placeholder for invalid date-only value %s',
    (value) => {
      expect(formatDateOnly(value)).toBe('—');
    },
  );
});
