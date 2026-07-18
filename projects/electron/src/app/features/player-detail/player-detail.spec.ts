import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { PlayerDetail } from './player-detail';

describe('PlayerDetail', () => {
  let component: PlayerDetail;
  let fixture: ComponentFixture<PlayerDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerDetail],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            key: '23:1',
            version: 23,
            playerId: 1,
            name: 'Test Player',
            nationality: 'Testland',
            teams: [],
            leagues: [],
            positions: ['ST'],
            age: 20,
            overall: 80,
            potential: 85,
            bestPosition: 'ST',
            bestRating: 82,
            firstName: 'Test',
            lastName: 'Player',
            commonName: '',
            jerseyName: '',
            birthDate: '2002-01-01',
            snapshotDate: '2022-09-01',
            height: 180,
            weight: 75,
            preferredFoot: 'Right',
            attackingWorkRate: 'High',
            defensiveWorkRate: 'Low',
            attributes: { finishing: 80 },
            ratings: { ST: 82 },
            raw: { playerid: 1 },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
