import type { DatabaseDescriptor } from '../qdb-contracts';

const fallbackVersions = Array.from({ length: 13 }, (_, index) => 23 - index);

export const databaseVersions = (
  databases: DatabaseDescriptor[],
  selectedIds: string[],
): number[] => {
  const selected = selectedIds.length
    ? databases.filter((database) => selectedIds.includes(database.id))
    : databases;
  if (!selected.length) return fallbackVersions;
  return [...new Set(selected.flatMap((database) => database.versions))].sort(
    (left, right) => right - left,
  );
};
