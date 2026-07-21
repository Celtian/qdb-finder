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
    });
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
        squad_size: 0,
        overall: null,
        attack: null,
        midfield: null,
        defence: null,
        foundation_year: null,
      }),
    ).toMatchObject({
      leagueId: null,
      leagueKey: '',
      leagueName: '',
      countryId: null,
      countryName: '',
      countryCode: '',
      overall: null,
      foundationYear: null,
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
  it('returns safe defaults for an empty metadata table', () => {
    const directory = mkdtempSync(join(tmpdir(), 'qdb-metadata-'));
    const path = join(directory, 'empty.sqlite');
    const writable = new DatabaseSync(path);
    writable.exec(
      'PRAGMA user_version = 1; CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
    );
    writable.prepare('INSERT INTO metadata VALUES (?, ?)').run('schema_version', '1');
    writable.close();

    const database = new PlayerDatabase(path);
    expect(database.info()).toMatchObject({
      id: 'unknown',
      name: 'Unnamed database',
      kind: 'built-in',
      schemaVersion: 1,
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
