import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';

import type { LeagueDetails } from '../../core/qdb-contracts';
import { LeagueDetail } from './league-detail';

const league: LeagueDetails = {
  key: '23:13',
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
      version: 23,
      teamId: 1,
      name: 'Arsenal',
      leagueId: 13,
      leagueKey: 'england premier league (1)',
      leagueName: 'England Premier League (1)',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      squadSize: 33,
      overall: 80,
      attack: 83,
      midfield: 80,
      defence: 79,
      foundationYear: 1886,
    },
  ],
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
        provideRouter([
          { path: 'teams', component: LeagueDetail },
          { path: 'players', component: LeagueDetail },
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
  });

  it('navigates to exact league teams and players', async () => {
    const testable = component as unknown as {
      viewTeams(): Promise<void>;
      viewPlayers(): Promise<void>;
    };
    const router = TestBed.inject(Router);

    await testable.viewTeams();
    expect(router.url).toBe('/teams?version=23&leagueId=13');
    await testable.viewPlayers();
    expect(router.url).toBe('/players?version=23&leagueId=13');
    expect(close).toHaveBeenCalledTimes(2);
  });
});
