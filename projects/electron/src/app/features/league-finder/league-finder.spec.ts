import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Qdb } from '../../core/qdb';
import type { LeagueSearchRequest } from '../../core/qdb-contracts';
import { LeagueFinder } from './league-finder';

describe('LeagueFinder', () => {
  let component: LeagueFinder;
  let fixture: ComponentFixture<LeagueFinder>;
  const searchLeagues = vi.fn(async () => ({ rows: [], total: 0, offset: 0, pageSize: 50 }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueFinder],
      providers: [
        {
          provide: Qdb,
          useValue: {
            searchLeagues,
            suggestEntityFacets: vi.fn(async () => []),
            getLeague: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    searchLeagues.mockClear();
    fixture = TestBed.createComponent(LeagueFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates with newest-edition sorting', () => {
    const testable = component as unknown as { request(): LeagueSearchRequest };

    expect(component).toBeTruthy();
    expect(testable.request()).toMatchObject({ sort: 'version', direction: 'desc' });
  });

  it('searches immediately when league tiers change', async () => {
    const testable = component as unknown as { setLevels(levels: number[]): void };
    searchLeagues.mockClear();

    testable.setLevels([1, 2]);
    await fixture.whenStable();

    expect(searchLeagues).toHaveBeenCalledWith(expect.objectContaining({ levels: [1, 2] }));
  });
});
