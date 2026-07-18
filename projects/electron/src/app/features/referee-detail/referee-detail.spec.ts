import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideRouter, Router } from '@angular/router';

import type { RefereeDetails } from '../../core/qdb-contracts';
import { RefereeDetail } from './referee-detail';

const referee: RefereeDetails = {
  key: '23:188446',
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
  leaguesPreview: [
    {
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
    },
  ],
  raw: { refereeid: 188446 },
};

describe('RefereeDetail', () => {
  let component: RefereeDetail;
  let fixture: ComponentFixture<RefereeDetail>;
  const close = vi.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefereeDetail],
      providers: [
        provideRouter([{ path: 'leagues', component: RefereeDetail }]),
        { provide: MAT_DIALOG_DATA, useValue: referee },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();
    close.mockClear();
    fixture = TestBed.createComponent(RefereeDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders the flag, metrics and league preview', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Test Referee');
    expect(element.textContent).toContain('183 cm');
    expect(element.textContent).toContain('England Premier League (1)');
    expect(element.querySelector('app-country-flag')).toBeTruthy();
  });

  it('opens the exact referee league context', async () => {
    await (component as unknown as { viewLeagues(): Promise<void> }).viewLeagues();
    expect(TestBed.inject(Router).url).toBe('/leagues?version=23&refereeId=188446');
    expect(close).toHaveBeenCalledOnce();
  });
});
