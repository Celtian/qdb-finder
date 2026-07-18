import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerFinder } from './player-finder';

describe('PlayerFinder', () => {
  let component: PlayerFinder;
  let fixture: ComponentFixture<PlayerFinder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerFinder],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
