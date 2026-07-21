import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Home · QDB Finder',
    loadComponent: () => import('./features/home/home').then((module) => module.Home),
  },
  {
    path: 'databases',
    title: 'Databases · QDB Finder',
    loadComponent: () =>
      import('./features/databases/databases').then((module) => module.Databases),
  },
  {
    path: 'settings',
    title: 'Settings · QDB Finder',
    loadComponent: () => import('./features/settings/settings').then((module) => module.Settings),
  },
  {
    path: 'players',
    title: 'Players · QDB Finder',
    loadComponent: () =>
      import('./features/player-finder/player-finder').then((module) => module.PlayerFinder),
  },
  {
    path: 'teams',
    title: 'Teams · QDB Finder',
    loadComponent: () =>
      import('./features/team-finder/team-finder').then((module) => module.TeamFinder),
  },
  {
    path: 'leagues',
    title: 'Leagues · QDB Finder',
    loadComponent: () =>
      import('./features/league-finder/league-finder').then((module) => module.LeagueFinder),
  },
  {
    path: 'referees',
    title: 'Referees · QDB Finder',
    loadComponent: () =>
      import('./features/referee-finder/referee-finder').then((module) => module.RefereeFinder),
  },
  {
    path: 'stadiums',
    title: 'Stadiums · QDB Finder',
    loadComponent: () =>
      import('./features/stadium-finder/stadium-finder').then((module) => module.StadiumFinder),
  },
  { path: '**', redirectTo: '' },
];
