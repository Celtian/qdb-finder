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
            nationalityCode: 'cz',
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

  it('uses the attacker color treatment for position data', () => {
    const element = fixture.nativeElement as HTMLElement;
    const attackerBadges = element.querySelectorAll('.position-attacker');

    expect(attackerBadges).toHaveLength(2);
    expect([...attackerBadges].every((badge) => badge.textContent?.includes('ST'))).toBe(true);
  });

  it('renders a large decorative nationality flag', () => {
    const element = fixture.nativeElement as HTMLElement;
    const flag = element.querySelector('app-country-flag');
    const image = flag?.querySelector('img');

    expect(flag).toBeTruthy();
    expect(image?.getAttribute('width')).toBe('40');
    expect(image?.getAttribute('height')).toBe('30');
    expect(image?.getAttribute('alt')).toBe('');
    expect(flag?.querySelector('picture')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders an accessible Material icon button to close the dialog', () => {
    const element = fixture.nativeElement as HTMLElement;
    const closeButton = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Close player details"]',
    );

    expect(closeButton).toBeTruthy();
    expect(closeButton?.classList.contains('mat-mdc-icon-button')).toBe(true);
    expect(closeButton?.querySelector('mat-icon')?.textContent).toContain('close');
  });
});
