import { Routes } from '@angular/router';

const page = (slug: string, title: string): Routes[number] => ({
  path: slug === 'overview' ? '' : slug,
  loadComponent: () => import('./pages/home/home').then((module) => module.Home),
  data: { slug },
  title: `${title} · QDB Finder`,
});

export const routes: Routes = [
  page('overview', 'Documentation'),
  page('installation', 'Installation'),
  page('searching', 'Searching and filters'),
  page('databases-and-settings', 'Databases and settings'),
  page('players', 'Players'),
  page('teams-and-leagues', 'Teams and leagues'),
  page('referees-and-stadiums', 'Referees and stadiums'),
  page('supported-data', 'Supported FIFA data'),
  page('development', 'Development'),
  page('database', 'Database generation'),
  page('licensing', 'Licensing'),
  page('releases', 'Releases'),
  { path: '**', redirectTo: '' },
];
