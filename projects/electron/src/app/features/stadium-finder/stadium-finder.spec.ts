import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Qdb } from '../../core/qdb';
import type {
  StadiumEditionRow,
  StadiumResultPage,
  StadiumSearchRequest,
} from '../../core/qdb-contracts';
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

  it('renders the original stadium ID as a non-sortable column after the name', async () => {
    const row: StadiumEditionRow = {
      key: 'internal-stadium-key',
      version: 23,
      stadiumId: 1098,
      name: 'Test Stadium',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      capacity: 50_000,
      yearBuilt: 2000,
      pitchLengthMeters: 105,
      pitchWidthMeters: 68,
      isLicensed: true,
      isSmallSided: false,
      teamCount: 1,
    };
    const testable = component as unknown as {
      loading: { set(value: boolean): void };
      error: { set(value: string): void };
      result: { set(value: StadiumResultPage): void };
    };

    testable.loading.set(false);
    testable.error.set('');
    testable.result.set({ rows: [row], total: 1, offset: 0, pageSize: 50 });
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const headers = [...element.querySelectorAll<HTMLElement>('th.mat-mdc-header-cell')].map(
      (header) => header.textContent?.trim(),
    );
    const originalIdHeader = element.querySelector<HTMLElement>('th.cdk-column-originalId');
    const originalIdCell = element.querySelector<HTMLElement>('td.cdk-column-originalId');
    expect(headers.slice(0, 3)).toEqual(['Stadium', 'Original ID', 'Edition']);
    expect(originalIdHeader?.querySelector('.mat-sort-header-container')).toBeNull();
    expect(originalIdCell?.textContent?.trim()).toBe('1098');
    expect(originalIdCell?.classList.contains('original-id')).toBe(true);
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
