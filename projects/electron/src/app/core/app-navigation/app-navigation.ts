import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AboutDialog } from '../about-dialog/about-dialog';
import { AppNavigationState } from '../app-navigation-state';

interface NavigationLink {
  path: string;
  icon: string;
  label: string;
  exact?: boolean;
}

interface NavigationGroup {
  id: string;
  links: readonly NavigationLink[];
}

@Component({
  selector: 'app-navigation',
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './app-navigation.html',
  styleUrl: './app-navigation.css',
})
export class AppNavigation {
  private readonly dialog = inject(MatDialog);
  protected readonly navigation = inject(AppNavigationState);

  protected readonly groups: readonly NavigationGroup[] = [
    {
      id: 'home',
      links: [{ path: '/', icon: 'home', label: 'Home', exact: true }],
    },
    {
      id: 'football',
      links: [
        { path: '/leagues', icon: 'emoji_events', label: 'Leagues' },
        { path: '/teams', icon: 'shield', label: 'Teams' },
        { path: '/players', icon: 'groups', label: 'Players' },
      ],
    },
    {
      id: 'venues-and-officials',
      links: [
        { path: '/referees', icon: 'sports', label: 'Referees' },
        { path: '/stadiums', icon: 'stadium', label: 'Stadiums' },
      ],
    },
    {
      id: 'management',
      links: [{ path: '/databases', icon: 'storage', label: 'Databases' }],
    },
  ];

  protected openAbout(): void {
    const mobile = this.navigation.isSmallScreen();
    if (mobile) this.navigation.closeForDialog();
    const dialog = this.dialog.open(AboutDialog, {
      width: '440px',
      maxWidth: 'calc(100vw - 2rem)',
      autoFocus: 'dialog',
      restoreFocus: !mobile,
    });
    if (mobile) dialog.afterClosed().subscribe(() => this.navigation.restoreTriggerFocus());
  }
}
