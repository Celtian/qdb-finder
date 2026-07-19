import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { PlayerDatabase } from '../../projects/electron/electron/database';
import {
  defaultLeagueSearchRequest,
  defaultRefereeSearchRequest,
  defaultSearchRequest,
  defaultStadiumSearchRequest,
  defaultTeamSearchRequest,
} from '../../projects/electron/src/app/core/qdb-contracts';

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

  it('filters player gender and treats pre-FIFA-16 editions as men', () => {
    expect(database.search({ ...request, versions: [15], gender: 'men' }).total).toBe(16_128);
    expect(database.search({ ...request, versions: [15], gender: 'women' }).total).toBe(0);
    expect(database.search({ ...request, versions: [16], gender: 'women' }).total).toBe(276);
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

  it('keeps same-name team editions distinct and returns nullable legacy ratings', () => {
    const arsenal = database.searchTeams({
      ...defaultTeamSearchRequest(),
      text: 'Arsenal',
      versions: [23],
    });
    const legacy = database.searchTeams({
      ...defaultTeamSearchRequest(),
      versions: [11],
      pageSize: 1,
    });

    expect(arsenal.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ teamId: 1, leagueId: 13 }),
        expect.objectContaining({ teamId: 116_009, leagueId: 2216 }),
      ]),
    );
    expect(legacy.rows[0]).toMatchObject({ overall: null, attack: null, foundationYear: null });
  });

  it('returns league country codes, counts and edition previews', () => {
    const leagues = database.searchLeagues({
      ...defaultLeagueSearchRequest(),
      text: 'Premier League',
      versions: [23],
    });
    const premierLeague = leagues.rows.find((row) => row.leagueId === 13);
    const legacyLeague = database.searchLeagues({
      ...defaultLeagueSearchRequest(),
      versions: [22],
      pageSize: 1,
    });

    expect(premierLeague).toMatchObject({
      countryCode: 'gb-eng',
      level: 1,
      teamCount: 20,
      playerCount: 636,
    });
    expect(database.getLeague({ version: 23, leagueId: 13 }).teams[0]).toMatchObject({
      version: 23,
      leagueId: 13,
    });
    expect(legacyLeague.rows[0]?.isWomen).toBeNull();
  });

  it('keeps entity pagination stable and treats injection-shaped names as text', () => {
    const teamRequest = {
      ...defaultTeamSearchRequest(),
      versions: [23],
      pageSize: 5,
      sort: 'name' as const,
      direction: 'asc' as const,
    };
    const first = database.searchTeams(teamRequest);
    const second = database.searchTeams({ ...teamRequest, offset: 5 });

    expect(new Set([...first.rows, ...second.rows].map((row) => row.key)).size).toBe(10);
    expect(database.searchTeams({ ...teamRequest, text: "Arsenal' OR 1=1 --" }).total).toBe(0);
    expect(
      database.searchLeagues({
        ...defaultLeagueSearchRequest(),
        text: "Premier' OR 1=1 --",
      }).total,
    ).toBe(0);
  });

  it('filters players by exact team and league edition IDs', () => {
    const men = database.search({
      ...request,
      versions: [23],
      teamEdition: { version: 23, teamId: 1 },
      pageSize: 100,
    });
    const women = database.search({
      ...request,
      versions: [23],
      teamEdition: { version: 23, teamId: 116_009 },
      pageSize: 100,
    });
    const league = database.search({
      ...request,
      versions: [23],
      leagueEdition: { version: 23, leagueId: 13 },
    });

    expect(men.total).toBe(33);
    expect(women.total).toBe(20);
    expect(men.rows.every((row) => row.teams.includes('Arsenal'))).toBe(true);
    expect(league.total).toBe(636);
  });

  it('returns version-aware country and league facets', () => {
    expect(
      database.suggestEntityFacets({
        entity: 'team',
        facet: 'country',
        text: 'England',
        versions: [23],
      })[0],
    ).toMatchObject({ id: 14, label: 'England', countryCode: 'gb-eng' });
    expect(
      database.suggestEntityFacets({
        entity: 'team',
        facet: 'league',
        text: 'Premier',
        versions: [23],
      }),
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: 'england premier league (1)' })]),
    );
  });

  it('returns canonical referee editions and FIFA 11 fallback league links', () => {
    const current = database.searchReferees({
      ...defaultRefereeSearchRequest(),
      text: 'Dong-Kyoo Choi',
      versions: [23],
    });
    const legacy = database.getReferee({ version: 11, refereeId: 29 });

    expect(current.rows[0]).toMatchObject({
      refereeId: 176_705,
      nationalityName: 'Korea Republic',
      nationalityCode: 'kr',
      age: 45,
    });
    expect(legacy).toMatchObject({
      name: 'Manuel Rui Barbosa',
      nationalityCode: 'br',
      foulStrictness: null,
      cardStrictness: null,
      isReal: null,
      leagueCount: 1,
    });
    expect(legacy.leaguesPreview[0]).toMatchObject({
      version: 11,
      leagueId: 7,
      name: 'Brazil Campeonato Brasileiro (1)',
    });
  });

  it('filters referee gender and treats pre-FIFA-16 editions as men', () => {
    expect(
      database.searchReferees({
        ...defaultRefereeSearchRequest(),
        versions: [15],
        gender: 'men',
      }).total,
    ).toBe(158);
    expect(
      database.searchReferees({
        ...defaultRefereeSearchRequest(),
        versions: [15],
        gender: 'women',
      }).total,
    ).toBe(0);
    expect(
      database.searchReferees({
        ...defaultRefereeSearchRequest(),
        versions: [16],
        gender: 'women',
      }).total,
    ).toBe(4);
  });

  it('keeps stadium countries source-faithful and historical status nullable', () => {
    const current = database.getStadium({ version: 23, stadiumId: 1 });
    const missingCountry = database.getStadium({ version: 17, stadiumId: 1 });
    const legacy = database.getStadium({ version: 11, stadiumId: 1 });

    expect(current).toMatchObject({
      name: 'Old Trafford',
      countryId: 14,
      countryCode: 'gb-eng',
      capacity: 74_879,
      isLicensed: true,
      teamCount: 2,
    });
    expect(missingCountry).toMatchObject({
      countryId: null,
      countryName: '',
      countryCode: '',
    });
    expect(legacy).toMatchObject({ yearBuilt: 1909, isLicensed: null });
  });

  it('filters both relationship directions by exact FIFA edition', () => {
    const referees = database.searchReferees({
      ...defaultRefereeSearchRequest(),
      leagueEdition: { version: 23, leagueId: 13 },
      pageSize: 100,
    });
    const leagues = database.searchLeagues({
      ...defaultLeagueSearchRequest(),
      refereeEdition: { version: 23, refereeId: 221_871 },
    });
    const stadiums = database.searchStadiums({
      ...defaultStadiumSearchRequest(),
      teamEdition: { version: 23, teamId: 11 },
    });
    const teams = database.searchTeams({
      ...defaultTeamSearchRequest(),
      stadiumEdition: { version: 23, stadiumId: 1 },
    });

    expect(referees.rows).toEqual(
      expect.arrayContaining([expect.objectContaining({ refereeId: 221_871, version: 23 })]),
    );
    expect(leagues.rows).toEqual(
      expect.arrayContaining([expect.objectContaining({ leagueId: 13, version: 23 })]),
    );
    expect(stadiums.rows).toEqual(
      expect.arrayContaining([expect.objectContaining({ stadiumId: 1, version: 23 })]),
    );
    expect(teams.rows).toEqual(
      expect.arrayContaining([expect.objectContaining({ teamId: 11, version: 23 })]),
    );
    expect(
      referees.rows.every(
        (row) =>
          row.version === 23 && row.leagues.some((league) => league.includes('Premier League')),
      ),
    ).toBe(true);
  });

  it('keeps referee and stadium pagination stable and escapes search input', () => {
    const refereeRequest = {
      ...defaultRefereeSearchRequest(),
      versions: [23],
      pageSize: 5,
      sort: 'name' as const,
      direction: 'asc' as const,
    };
    const stadiumRequest = {
      ...defaultStadiumSearchRequest(),
      versions: [23],
      pageSize: 5,
      sort: 'name' as const,
      direction: 'asc' as const,
    };
    const refereeRows = [
      ...database.searchReferees(refereeRequest).rows,
      ...database.searchReferees({ ...refereeRequest, offset: 5 }).rows,
    ];
    const stadiumRows = [
      ...database.searchStadiums(stadiumRequest).rows,
      ...database.searchStadiums({ ...stadiumRequest, offset: 5 }).rows,
    ];

    expect(new Set(refereeRows.map((row) => row.key)).size).toBe(10);
    expect(new Set(stadiumRows.map((row) => row.key)).size).toBe(10);
    expect(database.searchReferees({ ...refereeRequest, text: "Referee' OR 1=1 --" }).total).toBe(
      0,
    );
    expect(database.searchStadiums({ ...stadiumRequest, text: "Stadium' OR 1=1 --" }).total).toBe(
      0,
    );
  });

  it('returns referee and stadium facets with source country flags', () => {
    expect(
      database.suggestEntityFacets({
        entity: 'referee',
        facet: 'nationality',
        text: 'England',
        versions: [23],
      })[0],
    ).toMatchObject({ id: 14, label: 'England', countryCode: 'gb-eng' });
    expect(
      database.suggestEntityFacets({
        entity: 'stadium',
        facet: 'team',
        text: 'Manchester United',
        versions: [23],
      })[0],
    ).toMatchObject({ key: 'manchester united' });
  });

  it('reports exact canonical metadata', () => {
    expect(database.info()).toMatchObject({
      editions: 227_572,
      teamEditions: 8_907,
      leagueEditions: 560,
      refereeEditions: 2_516,
      stadiumEditions: 1_371,
      teamLinks: 241_640,
      sourceFiles: 306,
    });
  });
});
