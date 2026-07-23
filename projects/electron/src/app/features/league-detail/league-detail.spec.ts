import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MAT_TABS_CONFIG } from '@angular/material/tabs';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';
import { provideRouter, Router } from '@angular/router';

import type { LeagueDetails } from '../../core/qdb-contracts';
import { LeagueDetail } from './league-detail';

const league: LeagueDetails = {
  key: '23:13',
  databaseId: 'built-in',
  databaseName: 'Built-in FIFA 11–23',
  version: 23,
  leagueId: 13,
  name: 'England Premier League (1)',
  countryId: 14,
  countryName: 'England',
  countryCode: 'gb-eng',
  level: 1,
  isWomen: false,
  teamCount: 20,
  playerCount: 636,
  teams: [
    {
      key: '23:1',
      databaseId: 'built-in',
      databaseName: 'Built-in FIFA 11–23',
      version: 23,
      teamId: 1,
      name: 'Arsenal',
      leagueId: 13,
      leagueKey: 'england premier league (1)',
      leagueName: 'England Premier League (1)',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      isNational: false,
      squadSize: 33,
      overall: 80,
      attack: 83,
      midfield: 80,
      defence: 79,
      domesticPrestige: 7,
      internationalPrestige: 8,
      budget: null,
      foundationYear: 1886,
    },
  ],
  referees: [
    {
      key: '23:188446',
      databaseId: 'built-in',
      databaseName: 'Built-in FIFA 11–23',
      version: 23,
      refereeId: 188446,
      name: 'Test Referee',
      firstName: 'Test',
      lastName: 'Referee',
      nationalityId: 14,
      nationalityName: 'England',
      nationalityCode: 'gb-eng',
      birthDate: '1980-01-01',
      age: 43,
      height: 183,
      weight: 78,
      foulStrictness: 1,
      cardStrictness: 2,
      isReal: true,
      leagues: ['England Premier League (1)'],
      leagueCount: 1,
    },
  ],
  refereeCount: 1,
  raw: { leagueid: 13 },
};

describe('LeagueDetail', () => {
  let component: LeagueDetail;
  let fixture: ComponentFixture<LeagueDetail>;
  const close = vi.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueDetail],
      providers: [
        { provide: MAT_TABS_CONFIG, useValue: { animationDuration: '0ms' } },
        provideRouter([
          { path: 'teams', component: LeagueDetail },
          { path: 'players', component: LeagueDetail },
          { path: 'referees', component: LeagueDetail },
        ]),
        { provide: MAT_DIALOG_DATA, useValue: league },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();
    close.mockClear();
    fixture = TestBed.createComponent(LeagueDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders league metrics, country flag and team preview', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(component).toBeTruthy();
    expect(element.textContent).toContain('England Premier League (1)');
    expect(element.textContent).toContain('Arsenal');
    expect(element.querySelector('app-country-flag')).toBeTruthy();
    expect(
      element.querySelector('.detail-header .eyebrow')?.textContent?.replace(/\s+/g, ' ').trim(),
    ).toBe('FIFA 23 league · Built-in FIFA 11–23 · Original ID 13');
  });

  it('renders Overview by default and raw fields in the final tab', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const tabs = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatTabGroupHarness);
    const labels = await Promise.all((await tabs.getTabs()).map((tab) => tab.getLabel()));

    expect(labels).toEqual(['Overview', 'Raw fields']);
    expect(await (await tabs.getSelectedTab()).getLabel()).toBe('Overview');
    expect(element.querySelector('mat-expansion-panel')).toBeNull();

    await tabs.selectTab({ label: 'Raw fields' });
    await fixture.whenStable();

    expect(await (await tabs.getSelectedTab()).getTextContent()).toContain('leagueid');
  });

  it('navigates to exact league teams, players and referees', async () => {
    const testable = component as unknown as {
      viewTeams(): Promise<void>;
      viewPlayers(): Promise<void>;
      viewReferees(): Promise<void>;
    };
    const router = TestBed.inject(Router);

    await testable.viewTeams();
    expect(router.url).toBe('/teams?databaseId=built-in&version=23&leagueId=13');
    await testable.viewPlayers();
    expect(router.url).toBe('/players?databaseId=built-in&version=23&leagueId=13');
    await testable.viewReferees();
    expect(router.url).toBe('/referees?databaseId=built-in&version=23&leagueId=13');
    expect(close).toHaveBeenCalledTimes(3);
  });
});
