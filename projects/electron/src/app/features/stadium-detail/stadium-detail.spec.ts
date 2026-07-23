import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MAT_TABS_CONFIG } from '@angular/material/tabs';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';
import { provideRouter, Router } from '@angular/router';

import type { StadiumDetails } from '../../core/qdb-contracts';
import { StadiumDetail } from './stadium-detail';

const stadium: StadiumDetails = {
  key: '23:1',
  databaseId: 'built-in',
  databaseName: 'Built-in FIFA 11–23',
  version: 23,
  stadiumId: 1,
  name: 'Old Trafford',
  countryId: 14,
  countryName: 'England',
  countryCode: 'gb-eng',
  capacity: 74_879,
  yearBuilt: 1910,
  pitchLengthMeters: 105,
  pitchWidthMeters: 68,
  isLicensed: true,
  isSmallSided: false,
  teamCount: 1,
  teams: [
    {
      key: '23:11',
      databaseId: 'built-in',
      databaseName: 'Built-in FIFA 11–23',
      version: 23,
      teamId: 11,
      name: 'Manchester United',
      leagueId: 13,
      leagueKey: 'england premier league (1)',
      leagueName: 'England Premier League (1)',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      isNational: false,
      squadSize: 32,
      overall: 82,
      attack: 84,
      midfield: 83,
      defence: 81,
      domesticPrestige: 7,
      internationalPrestige: 8,
      budget: null,
      foundationYear: 1878,
    },
  ],
  raw: { stadiumid: 1 },
};

describe('StadiumDetail', () => {
  let component: StadiumDetail;
  let fixture: ComponentFixture<StadiumDetail>;
  const close = vi.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StadiumDetail],
      providers: [
        { provide: MAT_TABS_CONFIG, useValue: { animationDuration: '0ms' } },
        provideRouter([{ path: 'teams', component: StadiumDetail }]),
        { provide: MAT_DIALOG_DATA, useValue: stadium },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();
    close.mockClear();
    fixture = TestBed.createComponent(StadiumDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders the flag, pitch metrics and linked team preview', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Old Trafford');
    expect(element.textContent).toContain('74,879');
    expect(element.textContent).toContain('105 × 68 m');
    expect(element.textContent).toContain('Manchester United');
    expect(element.querySelector('app-country-flag')).toBeTruthy();
    expect(
      element.querySelector('.detail-header .eyebrow')?.textContent?.replace(/\s+/g, ' ').trim(),
    ).toBe('FIFA 23 stadium · Built-in FIFA 11–23 · Original ID 1');
  });

  it('renders Overview by default and raw fields in the final tab', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const tabs = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatTabGroupHarness);
    const labels = await Promise.all((await tabs.getTabs()).map((tab) => tab.getLabel()));

    expect(labels).toEqual(['Overview', 'Raw fields']);
    expect(await (await tabs.getSelectedTab()).getLabel()).toBe('Overview');
    expect(element.querySelector('mat-expansion-panel')).toBeNull();

    await tabs.selectTab({ label: 'Raw fields' });
    await fixture.whenStable();

    expect(await (await tabs.getSelectedTab()).getTextContent()).toContain('stadiumid');
  });

  it('opens the exact stadium team context', async () => {
    await (component as unknown as { viewTeams(): Promise<void> }).viewTeams();
    expect(TestBed.inject(Router).url).toBe('/teams?databaseId=built-in&version=23&stadiumId=1');
    expect(close).toHaveBeenCalledOnce();
  });
});
