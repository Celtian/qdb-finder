import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MAT_TABS_CONFIG } from '@angular/material/tabs';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';

import { PlayerDetail } from './player-detail';

describe('PlayerDetail', () => {
  let component: PlayerDetail;
  let fixture: ComponentFixture<PlayerDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerDetail],
      providers: [
        { provide: MAT_TABS_CONFIG, useValue: { animationDuration: '0ms' } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            key: '23:1',
            version: 23,
            playerId: 1,
            name: 'Test Player',
            nationality: 'Testland',
            nationalityCode: 'cz',
            teams: [],
            leagues: [],
            positions: ['ST'],
            age: 20,
            overall: 80,
            potential: 85,
            bestPosition: 'ST',
            bestRating: 82,
            firstName: 'Test',
            lastName: 'Player',
            commonName: '',
            jerseyName: '',
            birthDate: '2002-01-01',
            snapshotDate: '2022-09-01',
            height: 180,
            weight: 75,
            preferredFoot: '1',
            attackingWorkRate: 'High',
            defensiveWorkRate: 'Low',
            attributes: {
              finishing: 80,
              dribbling: 65,
              acceleration: 55,
              shotpower: 45,
              aggression: 70,
              marking: 81,
              gkdiving: 35,
            },
            ratings: { ST: 82 },
            raw: {
              playerid: 1,
              internationalrep: 3,
              preferredfoot: 1,
              birthdate: 123_456,
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders readable profile dates and preferred foot', () => {
    const element = fixture.nativeElement as HTMLElement;
    const terms = [...element.querySelectorAll<HTMLElement>('.profile-grid dt')];
    const valueFor = (label: string): string | undefined =>
      terms
        .find((term) => term.textContent?.trim() === label)
        ?.nextElementSibling?.textContent?.trim();

    expect(valueFor('Birth date')).toBe('1 Jan 2002');
    expect(valueFor('Snapshot')).toBe('1 Sep 2022');
    expect(valueFor('Preferred foot')).toBe('Right');
  });

  it('uses badge layout only for position pills, not rating tiles', () => {
    const element = fixture.nativeElement as HTMLElement;
    const attackerSurfaces = element.querySelectorAll('.position-attacker');
    const attackerBadges = element.querySelectorAll('.data-badge.position-attacker');
    const testable = component as unknown as {
      ratingRows: { tiles: { className: string }[] }[];
    };

    expect(attackerSurfaces).toHaveLength(2);
    expect(attackerBadges).toHaveLength(2);
    expect([...attackerSurfaces].every((surface) => surface.textContent?.includes('ST'))).toBe(
      true,
    );
    expect(testable.ratingRows[0]?.tiles[0]?.className).toBe('score-value score-green');
  });

  it('renders sparse ratings in the fixed pitch layout', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const tabs = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatTabGroupHarness);

    await tabs.selectTab({ label: 'Position matrix' });
    await fixture.whenStable();

    const selectedTab = await tabs.getSelectedTab();

    const rows = element.querySelectorAll<HTMLElement>('.position-matrix-row');
    const striker = element.querySelector<HTMLElement>('[data-position="ST"]');

    expect(await selectedTab.getLabel()).toBe('Position matrix');
    expect(await selectedTab.getTextContent()).toContain('ST');
    expect(rows).toHaveLength(8);
    expect([...rows].map((row) => row.dataset['row'])).toEqual([
      'strikers',
      'forwards',
      'attacking-midfielders',
      'midfielders',
      'defensive-midfielders',
      'defenders',
      'sweeper',
      'goalkeeper',
    ]);
    expect(striker?.style.gridColumn).toBe('3');
    expect(striker?.classList.contains('score-green')).toBe(true);
    expect(striker?.classList.contains('position-attacker')).toBe(false);
    expect(striker?.classList.contains('data-badge')).toBe(false);
    expect(striker?.textContent).toContain('82');
  });

  it('exposes the value color band for player attributes', () => {
    const testable = component as unknown as {
      attributeGroups: { attributes: { className: string }[] }[];
    };

    expect(testable.attributeGroups[0]?.attributes[0]?.className).toBe('score-value score-lime');
  });

  it('renders grouped attributes and special ratings', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const tabs = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatTabGroupHarness);

    await tabs.selectTab({ label: 'Attributes' });
    await fixture.whenStable();

    const headings = element.querySelectorAll<HTMLElement>('.attribute-group h3');
    const finishing = element.querySelector<HTMLElement>('[data-attribute="finishing"]');
    const potential = element.querySelector<HTMLElement>('[data-attribute="potential"]');
    const reputation = element.querySelector<HTMLElement>('[data-attribute="internationalrep"]');
    const stars = reputation?.querySelectorAll('.reputation-star');

    expect([...headings].map((heading) => heading.textContent?.trim())).toEqual([
      'Attacking',
      'Skill',
      'Movement',
      'Power',
      'Mentality',
      'Defending',
      'Goalkeeping',
      'Special',
    ]);
    expect(finishing?.closest<HTMLElement>('[data-group]')?.dataset['group']).toBe('attacking');
    expect(finishing?.classList.contains('score-lime')).toBe(true);
    expect(potential?.classList.contains('score-green')).toBe(true);
    expect(stars).toHaveLength(5);
    expect(reputation?.querySelectorAll('.reputation-star.filled')).toHaveLength(3);
    expect(reputation?.textContent).toContain('3 / 5');
    expect(reputation?.querySelector('.reputation-stars')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('renders raw fields as the final tab', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const tabs = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatTabGroupHarness);
    const labels = await Promise.all((await tabs.getTabs()).map((tab) => tab.getLabel()));

    expect(labels).toEqual(['Profile', 'Position matrix', 'Attributes', 'Raw fields']);
    expect(element.querySelector('mat-expansion-panel')).toBeNull();

    await tabs.selectTab({ label: 'Raw fields' });
    await fixture.whenStable();

    const rawText = await (await tabs.getSelectedTab()).getTextContent();
    const rawTerms = [...element.querySelectorAll<HTMLElement>('.raw-fields dt')];
    const rawValueFor = (label: string): string | undefined =>
      rawTerms
        .find((term) => term.textContent?.trim() === label)
        ?.nextElementSibling?.textContent?.trim();

    expect(rawText).toContain('playerid');
    expect(rawValueFor('preferredfoot')).toBe('1');
    expect(rawValueFor('birthdate')).toBe('123456');
  });

  it('colors overall and potential by their value bands', () => {
    const element = fixture.nativeElement as HTMLElement;
    const scores = element.querySelectorAll('.metric-grid .score-badge');

    expect(scores).toHaveLength(2);
    expect([...scores].every((score) => score.classList.contains('data-badge'))).toBe(true);
    expect(scores[0].classList.contains('score-lime')).toBe(true);
    expect(scores[1].classList.contains('score-green')).toBe(true);
  });

  it('renders a large decorative nationality flag', () => {
    const element = fixture.nativeElement as HTMLElement;
    const flag = element.querySelector('app-country-flag');
    const image = flag?.querySelector('img');

    expect(flag).toBeTruthy();
    expect(image?.getAttribute('width')).toBe('40');
    expect(image?.getAttribute('height')).toBe('30');
    expect(image?.getAttribute('alt')).toBe('');
    expect(flag?.querySelector('picture')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders an accessible Material icon button to close the dialog', () => {
    const element = fixture.nativeElement as HTMLElement;
    const closeButton = element.querySelector<HTMLButtonElement>(
      'button[aria-label="Close player details"]',
    );

    expect(closeButton).toBeTruthy();
    expect(closeButton?.classList.contains('mat-mdc-icon-button')).toBe(true);
    expect(closeButton?.querySelector('mat-icon')?.textContent).toContain('close');
  });
});
