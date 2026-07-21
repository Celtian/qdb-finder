import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MAT_TABS_CONFIG } from '@angular/material/tabs';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';
import { provideRouter, Router } from '@angular/router';

import type { RefereeDetails } from '../../core/qdb-contracts';
import { RefereeDetail } from './referee-detail';

const referee: RefereeDetails = {
  key: '23:188446',
  databaseId: 'built-in',
  databaseName: 'Built-in FIFA 11–23',
  version: 23,
  refereeId: 188446,
  name: 'Test Referee',
  firstName: 'Test',
  lastName: 'Referee',
  nationalityId: 14,
  nationalityName: 'England',
  nationalityCode: 'gb-eng',
  birthDate: '1980-01-01',
  age: 43,
  height: 183,
  weight: 78,
  foulStrictness: 1,
  cardStrictness: 2,
  isReal: true,
  leagues: ['England Premier League (1)'],
  leagueCount: 1,
  leaguesPreview: [
    {
      key: '23:13',
      databaseId: 'built-in',
      databaseName: 'Built-in FIFA 11–23',
      version: 23,
      leagueId: 13,
      name: 'England Premier League (1)',
      countryId: 14,
      countryName: 'England',
      countryCode: 'gb-eng',
      level: 1,
      isWomen: false,
      teamCount: 20,
      playerCount: 636,
    },
  ],
  raw: { refereeid: 188446 },
};

describe('RefereeDetail', () => {
  let component: RefereeDetail;
  let fixture: ComponentFixture<RefereeDetail>;
  const close = vi.fn();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefereeDetail],
      providers: [
        { provide: MAT_TABS_CONFIG, useValue: { animationDuration: '0ms' } },
        provideRouter([{ path: 'leagues', component: RefereeDetail }]),
        { provide: MAT_DIALOG_DATA, useValue: referee },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();
    close.mockClear();
    fixture = TestBed.createComponent(RefereeDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('renders the flag, metrics and league preview', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Test Referee');
    expect(element.textContent).toContain('183 cm');
    expect(element.textContent).toContain('England Premier League (1)');
    expect(element.querySelector('app-country-flag')).toBeTruthy();
    expect(
      element.querySelector('.detail-header .eyebrow')?.textContent?.replace(/\s+/g, ' ').trim(),
    ).toBe('FIFA 23 referee · Built-in FIFA 11–23 · Original ID 188446');
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

    expect(await (await tabs.getSelectedTab()).getTextContent()).toContain('refereeid');
  });

  it('opens the exact referee league context', async () => {
    await (component as unknown as { viewLeagues(): Promise<void> }).viewLeagues();
    expect(TestBed.inject(Router).url).toBe(
      '/leagues?databaseId=built-in&version=23&refereeId=188446',
    );
    expect(close).toHaveBeenCalledOnce();
  });
});
