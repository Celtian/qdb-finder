import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

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
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            searchLeagues,
            suggestEntityFacets: vi.fn(async () => []),
            getLeague: vi.fn(),
            getReferee: vi.fn(),
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

describe('LeagueFinder contextual routing', () => {
  it('applies and identifies an exact referee edition', async () => {
    const searchLeagues = vi.fn(async () => ({ rows: [], total: 0, offset: 0, pageSize: 50 }));
    const getReferee = vi.fn(async () => ({
      version: 23,
      refereeId: 221_871,
      name: 'Test Referee',
    }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'leagues', component: LeagueFinder }]),
        {
          provide: Qdb,
          useValue: {
            searchLeagues,
            getLeague: vi.fn(),
            getReferee,
            suggestEntityFacets: vi.fn(async () => []),
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl(
      '/leagues?version=23&refereeId=221871',
      LeagueFinder,
    );
    (component as unknown as { retrySearch(): void }).retrySearch();
    await harness.fixture.whenStable();

    expect(getReferee).toHaveBeenCalledWith({ version: 23, refereeId: 221_871 });
    expect(searchLeagues).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: [23],
        refereeEdition: { version: 23, refereeId: 221_871 },
      }),
    );
    expect(harness.routeNativeElement?.textContent).toContain('Test Referee');
  });
});
