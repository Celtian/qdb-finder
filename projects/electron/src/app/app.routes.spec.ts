import { routes } from './app.routes';

describe('application routes', () => {
  it('defines all entity destinations lazily with page titles', () => {
    expect(
      routes.slice(0, 8).map((route) => ({
        path: route.path,
        title: route.title,
        lazy: Boolean(route.loadComponent),
      })),
    ).toEqual([
      { path: '', title: 'Home · QDB Finder', lazy: true },
      { path: 'databases', title: 'Databases · QDB Finder', lazy: true },
      { path: 'settings', title: 'Settings · QDB Finder', lazy: true },
      { path: 'players', title: 'Players · QDB Finder', lazy: true },
      { path: 'teams', title: 'Teams · QDB Finder', lazy: true },
      { path: 'leagues', title: 'Leagues · QDB Finder', lazy: true },
      { path: 'referees', title: 'Referees · QDB Finder', lazy: true },
      { path: 'stadiums', title: 'Stadiums · QDB Finder', lazy: true },
    ]);
    expect(routes.at(-1)).toMatchObject({ path: '**', redirectTo: '' });
  });
});
