import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgxAppVersionDirective } from 'ngx-app-version';
import { map } from 'rxjs';
import { siteMetadata } from './site-metadata';

interface DocumentationLink {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-root',
  imports: [
    NgOptimizedImage,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  hostDirectives: [NgxAppVersionDirective],
})
export class App {
  private readonly breakpoint = inject(BreakpointObserver);
  protected readonly site = siteMetadata;
  protected readonly links: readonly DocumentationLink[] = [
    { path: '', label: 'Overview', icon: 'home' },
    { path: 'installation', label: 'Installation', icon: 'download' },
    { path: 'searching', label: 'Searching & filters', icon: 'search' },
    { path: 'databases-and-settings', label: 'Databases & settings', icon: 'settings' },
    { path: 'players', label: 'Players', icon: 'groups' },
    { path: 'teams-and-leagues', label: 'Teams & leagues', icon: 'shield' },
    { path: 'referees-and-stadiums', label: 'Referees & stadiums', icon: 'sports' },
    { path: 'supported-data', label: 'Supported FIFA data', icon: 'dataset' },
    { path: 'development', label: 'Development', icon: 'code' },
    { path: 'database', label: 'Database generation', icon: 'storage' },
    { path: 'licensing', label: 'Licensing', icon: 'policy' },
    { path: 'releases', label: 'Releases', icon: 'new_releases' },
  ];
  protected readonly compactNavigation = toSignal(
    this.breakpoint.observe('(max-width: 900px)').pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly mobileNavigationOpen = signal(false);
  protected readonly navigationMode = computed(() =>
    this.compactNavigation() ? ('over' as const) : ('side' as const),
  );
  protected readonly navigationOpened = computed(
    () => !this.compactNavigation() || this.mobileNavigationOpen(),
  );

  protected toggleNavigation(): void {
    this.mobileNavigationOpen.update((opened) => !opened);
  }

  protected closeNavigation(): void {
    if (this.compactNavigation()) this.mobileNavigationOpen.set(false);
  }

  protected navigationChanged(opened: boolean): void {
    if (this.compactNavigation() && !opened) this.mobileNavigationOpen.set(false);
  }
}
