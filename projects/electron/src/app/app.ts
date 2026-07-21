import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NgxAppVersionDirective } from 'ngx-app-version';
import { filter } from 'rxjs';
import { AppNavigation } from './core/app-navigation/app-navigation';
import { AppNavigationState } from './core/app-navigation-state';

@Component({
  selector: 'app-root',
  imports: [AppNavigation, MatSidenavModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  hostDirectives: [NgxAppVersionDirective],
})
export class App {
  private readonly router = inject(Router);
  protected readonly navigation = inject(AppNavigationState);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.navigation.destinationSelected());
  }
}
