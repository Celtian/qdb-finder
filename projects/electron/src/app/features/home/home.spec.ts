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
            getDatabaseInfo: vi.fn(async () => ({
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
            })),
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

  it('renders all database-backed entity links', () => {
    const element = fixture.nativeElement as HTMLElement;
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
