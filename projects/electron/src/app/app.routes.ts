import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/player-finder/player-finder').then((module) => module.PlayerFinder),
  },
  { path: '**', redirectTo: '' },
];
