import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Qdb } from '../../core/qdb';
import type { StadiumSearchRequest } from '../../core/qdb-contracts';
import { StadiumFinder } from './stadium-finder';

describe('StadiumFinder', () => {
  let component: StadiumFinder;
  let fixture: ComponentFixture<StadiumFinder>;
  const searchStadiums = vi.fn(async (request: StadiumSearchRequest) => ({
    rows: [],
    total: 0,
    offset: request.offset,
    pageSize: request.pageSize,
  }));

  beforeEach(async () => {
    searchStadiums.mockClear();
    await TestBed.configureTestingModule({
      imports: [StadiumFinder],
      providers: [
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            searchStadiums,
            getTeam: vi.fn(),
            getStadium: vi.fn(),
            suggestEntityFacets: vi.fn(async () => []),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StadiumFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders the empty state after loading', async () => {
    expect(component).toBeTruthy();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain(
        'No stadiums match these filters',
      );
    });
  });

  it('applies licensed and capacity filters immediately', () => {
    const testable = component as unknown as {
      setAvailability(value: 'all' | 'licensed' | 'generic'): void;
      setCapacity(boundary: 'min' | 'max', event: Event): void;
    };
    testable.setAvailability('licensed');
    testable.setCapacity('min', { target: { value: '50000' } } as unknown as Event);

    expect(searchStadiums).toHaveBeenLastCalledWith(
      expect.objectContaining({ isLicensed: true, capacity: { min: 50_000 } }),
    );
  });
});

describe('StadiumFinder contextual routing', () => {
  it('applies and identifies an exact team edition', async () => {
    const searchStadiums = vi.fn(async (request: StadiumSearchRequest) => ({
      rows: [],
      total: 0,
      offset: request.offset,
      pageSize: request.pageSize,
    }));
    const getTeam = vi.fn(async () => ({ version: 23, teamId: 11, name: 'Manchester United' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'stadiums', component: StadiumFinder }]),
        {
          provide: Qdb,
          useValue: {
            searchStadiums,
            getTeam,
            getStadium: vi.fn(),
            suggestEntityFacets: vi.fn(async () => []),
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/stadiums?version=23&teamId=11', StadiumFinder);
    (component as unknown as { retrySearch(): void }).retrySearch();
    await harness.fixture.whenStable();

    expect(getTeam).toHaveBeenCalledWith({ version: 23, teamId: 11 });
    expect(searchStadiums).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: [23],
        teamEdition: { version: 23, teamId: 11 },
      }),
    );
    expect(harness.routeNativeElement?.textContent).toContain('Manchester United');
  });
});
