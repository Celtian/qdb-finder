import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Qdb } from '../../core/qdb';
import type {
  FilterSuggestion,
  PlayerSearchRow,
  SearchRequest,
  SearchResultPage,
} from '../../core/qdb-contracts';
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
  const suggestFilters = vi.fn(async (): Promise<FilterSuggestion[]> => []);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerFinder],
      providers: [
        {
          provide: Qdb,
          useValue: {
            searchPlayers,
            suggestFilters,
            getPlayer: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    searchPlayers.mockClear();
    suggestFilters.mockReset();
    suggestFilters.mockResolvedValue([]);
    fixture = TestBed.createComponent(PlayerFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sorts the newest FIFA editions first by default', () => {
    const testable = component as unknown as {
      request(): SearchRequest;
    };

    expect(testable.request()).toMatchObject({ sort: 'version', direction: 'desc' });
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

  it('keeps a Nations-table code with the selected nationality chip', async () => {
    const testable = component as unknown as {
      addExactFilter(
        field: 'nationalities',
        option: FilterSuggestion,
        input: HTMLInputElement,
      ): void;
      nationalityCode(key: string): string;
    };

    testable.addExactFilter(
      'nationalities',
      { key: 'brazil', label: 'Brazil', count: 1, nationalityCode: 'br' },
      document.createElement('input'),
    );
    await fixture.whenStable();

    expect(testable.nationalityCode('brazil')).toBe('br');
    const flag = (fixture.nativeElement as HTMLElement).querySelector(
      'mat-chip app-country-flag img',
    );
    expect(flag?.getAttribute('ng-reflect-ng-src') ?? flag?.getAttribute('src')).toContain(
      '/flags/20x15/br.png',
    );
  });

  it('renders flags in nationality autocomplete options', async () => {
    suggestFilters.mockResolvedValue([
      { key: 'brazil', label: 'Brazil', count: 100, nationalityCode: 'br' },
    ]);
    const nationalityInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '.filters input',
    );

    expect(nationalityInput).toBeTruthy();
    nationalityInput!.focus();
    nationalityInput!.dispatchEvent(new Event('focus'));
    await fixture.whenStable();
    nationalityInput!.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(document.body.querySelector('mat-option app-country-flag')).toBeTruthy();
  });

  it('renders the database nationality code beside result text', async () => {
    const testable = component as unknown as {
      loading: { set(value: boolean): void };
      result: {
        set(value: SearchResultPage): void;
      };
    };
    testable.loading.set(false);
    const testableResultRow: PlayerSearchRow = {
      key: '23:1',
      version: 23,
      playerId: 1,
      name: 'Test Player',
      nationality: 'Brazil',
      nationalityCode: 'br',
      teams: [],
      leagues: [],
      positions: ['ST'],
      age: 20,
      overall: 80,
      potential: 85,
      bestPosition: 'ST',
      bestRating: 82,
    };
    testable.result.set({
      rows: [testableResultRow],
      total: 1,
      offset: 0,
      pageSize: 50,
    });
    fixture.detectChanges();

    const nationalityCell = (fixture.nativeElement as HTMLElement).querySelector(
      'td.cdk-column-nationality',
    );
    expect(nationalityCell?.textContent).toContain('Brazil');
    expect(nationalityCell?.querySelector('app-country-flag')).toBeTruthy();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('td.cdk-column-overall .score-lime'),
    ).toBeTruthy();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('td.cdk-column-potential .score-green'),
    ).toBeTruthy();

    testable.result.set({
      rows: [{ ...testableResultRow, nationality: 'Unknown nation', nationalityCode: '' }],
      total: 1,
      offset: 0,
      pageSize: 50,
    });
    fixture.detectChanges();

    const missingFlagCell = (fixture.nativeElement as HTMLElement).querySelector(
      'td.cdk-column-nationality',
    );
    expect(missingFlagCell?.textContent).toContain('Unknown nation');
    expect(missingFlagCell?.querySelector('app-country-flag')).toBeNull();
  });
});
