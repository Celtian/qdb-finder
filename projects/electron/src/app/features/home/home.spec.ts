import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Qdb } from '../../core/qdb';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            listDatabases: vi.fn(async () => [
              {
                id: 'built-in',
                name: 'Built-in FIFA 11–23',
                kind: 'built-in' as const,
                schemaVersion: 3,
                editions: 227_572,
                teamEditions: 8_907,
                leagueEditions: 560,
                refereeEditions: 2_516,
                stadiumEditions: 1_371,
                teamLinks: 241_640,
                sourceFiles: 306,
                versions: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
                generatedAt: '2026-07-18T00:00:00.000Z',
                sqliteVersion: '3.50.0',
                status: 'available' as const,
              },
            ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the compact page header and keeps the introduction in the content', () => {
    const element = fixture.nativeElement as HTMLElement;
    const header = element.querySelector('header.page-heading');
    const lead = element.querySelector('main > .lead');

    expect(header?.querySelector('app-navigation-trigger')).toBeTruthy();
    expect(header?.querySelector('.eyebrow')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '1 searchable database',
    );
    expect(header?.querySelector('h1')?.textContent?.trim()).toBe('Explore every edition');
    expect(header?.querySelector('.lead')).toBeNull();
    expect(lead?.textContent).toContain('Browse players, teams, leagues, referees and stadiums');
  });

  it('renders all database-backed entity links', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-navigation-trigger')).toBeTruthy();
    const tiles = [...element.querySelectorAll<HTMLAnchorElement>('.browse-tile')];

    expect(tiles.map((tile) => tile.textContent)).toEqual([
      expect.stringContaining('227,572 editions'),
      expect.stringContaining('8,907 editions'),
      expect.stringContaining('560 editions'),
      expect.stringContaining('2,516 editions'),
      expect.stringContaining('1,371 editions'),
    ]);
    expect(tiles.map((tile) => tile.getAttribute('href'))).toEqual([
      '/players',
      '/teams',
      '/leagues',
      '/referees',
      '/stadiums',
    ]);
  });
});
