const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const preferredFootLabel = (value: string | number | null | undefined): string => {
  const normalized = String(value ?? '')
    .trim()
    .toLocaleLowerCase('en');
  if (normalized === '1' || normalized === 'right') return 'Right';
  if (normalized === '2' || normalized === 'left') return 'Left';
  return '—';
};

export const formatDateOnly = (value: string | null | undefined): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return '—';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1000 || month < 1 || month > 12 || day < 1) return '—';
  const date = new Date(Date.UTC(year, month - 1, day));
  const monthLabel = MONTH_LABELS[month - 1];
  if (
    !monthLabel ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return '—';
  return `${day} ${monthLabel} ${year}`;
};
