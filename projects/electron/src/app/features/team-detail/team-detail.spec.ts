import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';

import type { TeamDetails } from '../../core/qdb-contracts';
import { TeamDetail } from './team-detail';

const team: TeamDetails = {
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
  players: [
    {
      key: '23:1',
      version: 23,
      playerId: 1,
      name: 'Test Player',
      nationality: 'England',
      nationalityCode: 'gb-eng',
      teams: ['Arsenal'],
      leagues: ['England Premier League (1)'],
      positions: ['ST'],
      age: 25,
      overall: 80,
      potential: 82,
      bestPosition: 'ST',
      bestRating: 81,
    },
  ],
  raw: { teamid: 1 },
};

describe('TeamDetail', () => {
  let component: TeamDetail;
  let fixture: ComponentFixture<TeamDetail>;
  const close = vi.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamDetail],
      providers: [
        provideRouter([{ path: 'players', component: TeamDetail }]),
        { provide: MAT_DIALOG_DATA, useValue: team },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();
    close.mockClear();
    fixture = TestBed.createComponent(TeamDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders metrics, a flag and the roster preview', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(component).toBeTruthy();
    expect(element.textContent).toContain('Arsenal');
    expect(element.textContent).toContain('Test Player');
    expect(element.querySelector('app-country-flag')).toBeTruthy();
    expect(element.querySelector('.score-lime')).toBeTruthy();
  });

  it('navigates to the exact team edition players', async () => {
    const testable = component as unknown as { viewPlayers(): Promise<void> };
    await testable.viewPlayers();

    expect(TestBed.inject(Router).url).toBe('/players?version=23&teamId=1');
    expect(close).toHaveBeenCalledOnce();
  });
});
