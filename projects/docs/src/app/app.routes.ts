import { Routes } from '@angular/router';

const page = (slug: string): Routes[number] => ({
  path: slug === 'overview' ? '' : slug,
  loadComponent: () => import('./pages/home/home').then((module) => module.Home),
  data: { slug },
});

export const routes: Routes = [
  page('overview'),
  page('installation'),
  page('searching'),
  page('supported-data'),
  page('development'),
  page('database'),
  page('licensing'),
  page('releases'),
  { path: '**', redirectTo: '' },
];
