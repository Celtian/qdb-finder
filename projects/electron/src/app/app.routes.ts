import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Home · QDB Finder',
    loadComponent: () => import('./features/home/home').then((module) => module.Home),
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
  { path: '**', redirectTo: '' },
];
