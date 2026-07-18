import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Qdb } from '../../core/qdb';
import type { RefereeSearchRequest } from '../../core/qdb-contracts';
import { RefereeFinder } from './referee-finder';

describe('RefereeFinder', () => {
  let component: RefereeFinder;
  let fixture: ComponentFixture<RefereeFinder>;
  const searchReferees = vi.fn(async (request: RefereeSearchRequest) => ({
    rows: [],
    total: 0,
    offset: request.offset,
    pageSize: request.pageSize,
  }));

  beforeEach(async () => {
    searchReferees.mockClear();
    await TestBed.configureTestingModule({
      imports: [RefereeFinder],
      providers: [
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            searchReferees,
            getLeague: vi.fn(),
            getReferee: vi.fn(),
            suggestEntityFacets: vi.fn(async () => []),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RefereeFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders the empty state after loading', async () => {
    expect(component).toBeTruthy();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        'No referees match these filters',
      );
    });
  });

  it('applies availability and age filters immediately', () => {
    const testable = component as unknown as {
      setAvailability(value: 'all' | 'real' | 'generic'): void;
      setAge(boundary: 'min' | 'max', event: Event): void;
    };
    testable.setAvailability('real');
    testable.setAge('min', { target: { value: '30' } } as unknown as Event);

    expect(searchReferees).toHaveBeenLastCalledWith(
      expect.objectContaining({ isReal: true, age: { min: 30 } }),
    );
  });
});

describe('RefereeFinder contextual routing', () => {
  it('applies and identifies an exact league edition', async () => {
    const searchReferees = vi.fn(async (request: RefereeSearchRequest) => ({
      rows: [],
      total: 0,
      offset: request.offset,
      pageSize: request.pageSize,
    }));
    const getLeague = vi.fn(async () => ({
      version: 23,
      leagueId: 13,
      name: 'England Premier League (1)',
    }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'referees', component: RefereeFinder }]),
        {
          provide: Qdb,
          useValue: {
            searchReferees,
            getLeague,
            getReferee: vi.fn(),
            suggestEntityFacets: vi.fn(async () => []),
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl(
      '/referees?version=23&leagueId=13',
      RefereeFinder,
    );
    (component as unknown as { retrySearch(): void }).retrySearch();
    await harness.fixture.whenStable();

    expect(getLeague).toHaveBeenCalledWith({ version: 23, leagueId: 13 });
    expect(searchReferees).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: [23],
        leagueEdition: { version: 23, leagueId: 13 },
      }),
    );
    expect(harness.routeNativeElement?.textContent).toContain('England Premier League (1)');
  });
});
