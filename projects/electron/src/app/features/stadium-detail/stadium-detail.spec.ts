import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';

import type { StadiumDetails } from '../../core/qdb-contracts';
import { StadiumDetail } from './stadium-detail';

const stadium: StadiumDetails = {
  key: '23:1',
  version: 23,
  stadiumId: 1,
  name: 'Old Trafford',
  countryId: 14,
  countryName: 'England',
  countryCode: 'gb-eng',
  capacity: 74_879,
  yearBuilt: 1910,
  pitchLengthMeters: 105,
  pitchWidthMeters: 68,
  isLicensed: true,
  isSmallSided: false,
  teamCount: 1,
  teams: [
    {
      key: '23:11',
      version: 23,
      teamId: 11,
      name: 'Manchester United',
      leagueId: 13,
      leagueKey: 'england premier league (1)',
      leagueName: 'England Premier League (1)',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      squadSize: 32,
      overall: 82,
      attack: 84,
      midfield: 83,
      defence: 81,
      foundationYear: 1878,
    },
  ],
  raw: { stadiumid: 1 },
};

describe('StadiumDetail', () => {
  let component: StadiumDetail;
  let fixture: ComponentFixture<StadiumDetail>;
  const close = vi.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StadiumDetail],
      providers: [
        provideRouter([{ path: 'teams', component: StadiumDetail }]),
        { provide: MAT_DIALOG_DATA, useValue: stadium },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();
    close.mockClear();
    fixture = TestBed.createComponent(StadiumDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders the flag, pitch metrics and linked team preview', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Old Trafford');
    expect(element.textContent).toContain('74,879');
    expect(element.textContent).toContain('105 × 68 m');
    expect(element.textContent).toContain('Manchester United');
    expect(element.querySelector('app-country-flag')).toBeTruthy();
  });

  it('opens the exact stadium team context', async () => {
    await (component as unknown as { viewTeams(): Promise<void> }).viewTeams();
    expect(TestBed.inject(Router).url).toBe('/teams?version=23&stadiumId=1');
    expect(close).toHaveBeenCalledOnce();
  });
});
