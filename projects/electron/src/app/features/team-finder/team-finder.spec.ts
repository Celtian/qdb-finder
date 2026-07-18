import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Qdb } from '../../core/qdb';
import type { TeamSearchRequest } from '../../core/qdb-contracts';
import { TeamFinder } from './team-finder';

describe('TeamFinder', () => {
  let component: TeamFinder;
  let fixture: ComponentFixture<TeamFinder>;
  const searchTeams = vi.fn(async () => ({ rows: [], total: 0, offset: 0, pageSize: 50 }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamFinder],
      providers: [
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            searchTeams,
            suggestEntityFacets: vi.fn(async () => []),
            getTeam: vi.fn(),
            getLeague: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    searchTeams.mockClear();
    fixture = TestBed.createComponent(TeamFinder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('creates with newest-edition sorting', () => {
    const testable = component as unknown as { request(): TeamSearchRequest };

    expect(component).toBeTruthy();
    expect(testable.request()).toMatchObject({ sort: 'version', direction: 'desc' });
  });

  it('searches immediately when a rating range changes', async () => {
    const overallMin = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'fieldset input',
    );
    searchTeams.mockClear();

    overallMin!.value = '80';
    overallMin!.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(searchTeams).toHaveBeenCalledWith(expect.objectContaining({ overall: { min: 80 } }));
  });
});

describe('TeamFinder stadium contextual routing', () => {
  it('applies and identifies an exact stadium edition', async () => {
    const searchTeams = vi.fn(async () => ({ rows: [], total: 0, offset: 0, pageSize: 50 }));
    const getStadium = vi.fn(async () => ({ version: 23, stadiumId: 1, name: 'Old Trafford' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'teams', component: TeamFinder }]),
        {
          provide: Qdb,
          useValue: {
            searchTeams,
            getTeam: vi.fn(),
            getLeague: vi.fn(),
            getStadium,
            suggestEntityFacets: vi.fn(async () => []),
          },
        },
      ],
    });
    const harness = await RouterTestingHarness.create();

    const component = await harness.navigateByUrl('/teams?version=23&stadiumId=1', TeamFinder);
    (component as unknown as { retrySearch(): void }).retrySearch();
    await harness.fixture.whenStable();

    expect(getStadium).toHaveBeenCalledWith({ version: 23, stadiumId: 1 });
    expect(searchTeams).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: [23],
        stadiumEdition: { version: 23, stadiumId: 1 },
      }),
    );
    expect(harness.routeNativeElement?.textContent).toContain('Old Trafford');
  });
});
