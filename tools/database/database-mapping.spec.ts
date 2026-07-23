import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterAll, describe, expect, it } from 'vitest';

import { PlayerDatabase } from '../../projects/electron/electron/database';
import type {
  LeagueEditionRow,
  PlayerSearchRow,
  RefereeEditionRow,
  StadiumEditionRow,
  TeamEditionRow,
} from '../../projects/electron/src/app/core/qdb-contracts';

type Row = Record<string, string | number | null>;
interface DatabaseMappers {
  toSearchRow(row: Row): PlayerSearchRow;
  toTeamRow(row: Row): TeamEditionRow;
  toLeagueRow(row: Row): LeagueEditionRow;
  toRefereeRow(row: Row): RefereeEditionRow;
  toStadiumRow(row: Row): StadiumEditionRow;
}

const databasePath = join(process.cwd(), 'resources', 'database', 'qdb.sqlite');

describe('database row mapping fallbacks', () => {
  const database = new PlayerDatabase(databasePath);
  const mapper = database as unknown as DatabaseMappers;
  afterAll(() => database.close());

  it('maps nullable player relationship and profile fields', () => {
    expect(
      mapper.toSearchRow({
        key: '11:1',
        version: 11,
        player_id: 1,
        display_name: 'Legacy Player',
        nationality_name: null,
        nationality_code: null,
        team_names: null,
        league_names: null,
        positions: null,
        birth_date: null,
        age: null,
        height: null,
        weight: null,
        preferred_foot: '',
        overall: 50,
        potential: 50,
        best_position: 'GK',
        best_rating: 50,
      }),
    ).toMatchObject({
      nationality: '',
      nationalityCode: '',
      teams: [],
      leagues: [],
      positions: [],
      birthDate: null,
      age: null,
      height: null,
      weight: null,
      preferredFoot: '',
      contractValidUntil: null,
    });

    expect(
      mapper.toSearchRow({
        key: '23:1',
        version: 23,
        player_id: 1,
        display_name: 'Current Player',
        nationality_name: 'England',
        nationality_code: 'gb-eng',
        team_names: null,
        league_names: null,
        positions: 'ST',
        birth_date: '2000-01-01',
        age: 23,
        height: 180,
        weight: 75,
        preferred_foot: '1',
        overall: 80,
        potential: 82,
        best_position: 'ST',
        best_rating: 81,
        raw_json: '{"contractvaliduntil":2027}',
      }),
    ).toMatchObject({ contractValidUntil: 2027 });
  });

  it('maps nullable team and league fields', () => {
    expect(
      mapper.toTeamRow({
        key: '11:1',
        version: 11,
        team_id: 1,
        team_name: 'Legacy Team',
        league_id: null,
        league_key: null,
        league_name: null,
        country_id: null,
        country_name: null,
        country_code: null,
        is_national: 0,
        squad_size: 0,
        overall: null,
        attack: null,
        midfield: null,
        defence: null,
        foundation_year: null,
        raw_json: '{"domesticprestige":0,"internationalprestige":"invalid","transferbudget":0}',
      }),
    ).toMatchObject({
      leagueId: null,
      leagueKey: '',
      leagueName: '',
      countryId: null,
      countryName: '',
      countryCode: '',
      isNational: false,
      overall: null,
      domesticPrestige: 0,
      internationalPrestige: null,
      budget: 0,
      foundationYear: null,
    });
    expect(
      mapper.toTeamRow({
        key: '22:1',
        version: 22,
        team_id: 1,
        team_name: 'Current Team',
        is_national: 1,
        squad_size: 25,
        overall: 80,
        attack: 81,
        midfield: 79,
        defence: 78,
        foundation_year: 1900,
        raw_json: '{"domesticprestige":7,"internationalprestige":8,"transferbudget":75000000}',
      }),
    ).toMatchObject({
      isNational: true,
      domesticPrestige: 7,
      internationalPrestige: 8,
      budget: 75_000_000,
    });
    expect(
      mapper.toTeamRow({
        key: '23:1',
        version: 23,
        team_id: 1,
        team_name: 'Current Team',
        is_national: 0,
        squad_size: 25,
        overall: 80,
        attack: 81,
        midfield: 79,
        defence: 78,
        foundation_year: 1900,
        raw_json: '{}',
      }),
    ).toMatchObject({
      domesticPrestige: null,
      internationalPrestige: null,
      budget: null,
    });
    expect(
      mapper.toLeagueRow({
        key: '11:1',
        version: 11,
        league_id: 1,
        league_name: 'Legacy League',
        country_id: null,
        country_name: null,
        country_code: null,
        level: null,
        is_women: null,
        team_count: 0,
        player_count: 0,
      }),
    ).toMatchObject({ countryId: null, countryName: '', countryCode: '', isWomen: null });
  });

  it('maps nullable referee and stadium fields', () => {
    expect(
      mapper.toRefereeRow({
        key: '11:1',
        version: 11,
        referee_id: 1,
        referee_name: 'Legacy Referee',
        first_name: '',
        last_name: '',
        nationality_id: 0,
        nationality_name: null,
        nationality_code: null,
        birth_date: null,
        age: null,
        height: null,
        weight: null,
        foul_strictness: null,
        card_strictness: null,
        is_real: null,
        league_names: null,
        league_count: 0,
      }),
    ).toMatchObject({
      nationalityName: '',
      nationalityCode: '',
      birthDate: null,
      age: null,
      isReal: null,
      leagues: [],
    });
    expect(
      mapper.toStadiumRow({
        key: '11:1',
        version: 11,
        stadium_id: 1,
        stadium_name: 'Legacy Stadium',
        country_id: null,
        country_name: null,
        country_code: null,
        capacity: 0,
        year_built: null,
        pitch_length: null,
        pitch_width: null,
        is_licensed: null,
        is_small_sided: null,
        team_count: 0,
      }),
    ).toMatchObject({
      countryId: null,
      countryName: '',
      countryCode: '',
      pitchLengthMeters: null,
      pitchWidthMeters: null,
      isLicensed: null,
      isSmallSided: null,
    });
  });
});

describe('database metadata fallbacks', () => {
  it('requires schema-one databases to be re-imported', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-old-schema-'));
    const path = join(directory, 'old.sqlite');
    const writable = new DatabaseSync(path);
    writable.exec(
      'PRAGMA user_version = 1; CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
    );
    writable.prepare('INSERT INTO metadata VALUES (?, ?)').run('schema_version', '1');
    writable.close();

    expect(() => new PlayerDatabase(path)).toThrow(/Re-import this database/);
    rmSync(directory, { recursive: true });
  });

  it('returns safe defaults for an empty metadata table', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-metadata-'));
    const path = join(directory, 'empty.sqlite');
    const writable = new DatabaseSync(path);
    writable.exec(
      'PRAGMA user_version = 2; CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
    );
    writable.prepare('INSERT INTO metadata VALUES (?, ?)').run('schema_version', '2');
    writable.close();

    const database = new PlayerDatabase(path);
    expect(database.info()).toMatchObject({
      id: 'unknown',
      name: 'Unnamed database',
      kind: 'built-in',
      schemaVersion: 2,
      editions: 0,
      teamEditions: 0,
      leagueEditions: 0,
      refereeEditions: 0,
      stadiumEditions: 0,
      teamLinks: 0,
      sourceFiles: 0,
      versions: [],
      generatedAt: '',
    });
    database.close();
    rmSync(directory, { recursive: true });
  });
});
