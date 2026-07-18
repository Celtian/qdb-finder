import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Qdb } from '../../core/qdb';
import type { FilterSuggestion } from '../../core/qdb-contracts';
import { PlayerFinder } from './player-finder';

describe('PlayerFinder', () => {
  let component: PlayerFinder;
  let fixture: ComponentFixture<PlayerFinder>;
  const searchPlayers = vi.fn(async () => ({
    rows: [],
    total: 0,
    offset: 0,
    pageSize: 50,
  }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerFinder],
      providers: [
        {
          provide: Qdb,
          useValue: {
            searchPlayers,
            suggestFilters: vi.fn(async () => []),
            getPlayer: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    searchPlayers.mockClear();
    fixture = TestBed.createComponent(PlayerFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('searches immediately when a number range changes', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const ageMin = element.querySelector<HTMLInputElement>('fieldset input');
    expect(ageMin).toBeTruthy();
    searchPlayers.mockClear();

    ageMin!.value = '21';
    ageMin!.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(searchPlayers).toHaveBeenCalledWith(
      expect.objectContaining({ age: { min: 21 }, offset: 0 }),
    );
    expect(element.textContent).not.toContain('Apply filters');
  });

  it('keeps suggestion labels while searching with canonical lowercase keys', async () => {
    const testable = component as unknown as {
      addExactFilter(field: 'teams', option: FilterSuggestion, input: HTMLInputElement): void;
      filterLabel(field: 'teams', key: string): string;
    };
    const input = document.createElement('input');
    searchPlayers.mockClear();

    testable.addExactFilter(
      'teams',
      { key: 'olympique lyonnais', label: 'Olympique Lyonnais', count: 1 },
      input,
    );
    await fixture.whenStable();

    expect(testable.filterLabel('teams', 'olympique lyonnais')).toBe('Olympique Lyonnais');
    expect(searchPlayers).toHaveBeenCalledWith(
      expect.objectContaining({ teams: ['olympique lyonnais'] }),
    );
  });
});
