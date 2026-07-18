import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { PlayerDatabase } from '../../projects/electron/electron/database';
import { defaultSearchRequest } from '../../projects/electron/src/app/core/qdb-contracts';

const path = resolve(process.cwd(), 'resources', 'database', 'qdb.sqlite');
const integration = describe.skipIf(!existsSync(path));

integration('player queries', () => {
  const database = new PlayerDatabase(path);
  const request = { ...defaultSearchRequest(), pageSize: 10 };
  afterAll(() => database.close());

  it('finds player names and prefixes', () => {
    expect(
      database
        .search({ ...request, text: 'Messi' })
        .rows.some((row) => row.name === 'Lionel Messi'),
    ).toBe(true);
    expect(database.search({ ...request, text: 'Mess' }).total).toBeGreaterThan(0);
  });

  it('combines exact team, country, edition and rating filters', () => {
    expect(database.search({ ...request, nationalities: ['argentina'] }).total).toBeGreaterThan(
      1_000,
    );
    expect(database.search({ ...request, teams: ['arsenal'] }).total).toBeGreaterThan(100);
    const combined = database.search({
      ...request,
      versions: [23],
      overall: { min: 85 },
      potential: { min: 85 },
    });
    expect(
      combined.rows.every((row) => row.version === 23 && row.overall >= 85 && row.potential >= 85),
    ).toBe(true);
  });

  it('returns Nations-table codes for current and pre-FIFA-16 editions', () => {
    const current = database.search({
      ...request,
      versions: [23],
      nationalities: ['argentina'],
    });
    const legacy = database.search({
      ...request,
      versions: [11],
      nationalities: ['germany'],
    });

    expect(current.rows[0]?.nationalityCode).toBe('ar');
    expect(legacy.rows[0]?.nationalityCode).toBe('de');
    expect(
      database.suggest({ kind: 'nationality', text: 'England', versions: [23] })[0],
    ).toMatchObject({ nationalityCode: 'gb-eng' });
  });

  it('keeps pagination stable and treats injection-shaped input as text', () => {
    const first = database.search({ ...request, text: 'Messi', pageSize: 5 });
    const second = database.search({ ...request, text: 'Messi', pageSize: 5, offset: 5 });
    expect(new Set([...first.rows, ...second.rows].map((row) => row.key)).size).toBe(10);
    expect(database.search({ ...request, text: "Messi' OR 1=1 --" }).total).toBe(0);
  });

  it('reports exact canonical metadata', () => {
    expect(database.info()).toMatchObject({
      editions: 227_572,
      teamLinks: 241_640,
      sourceFiles: 306,
    });
  });
});
