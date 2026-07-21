import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAppVersion } from 'ngx-app-version';

import { VERSION_INFO } from '../../../version-info';
import { routes } from './app.routes';
import { ThemePreferences } from './core/theme-preferences';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(ThemePreferences).initialize()),
    provideRouter(routes),
    provideAppVersion({ version: VERSION_INFO.version }),
  ],
};
