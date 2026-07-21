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

  protected readonly links: readonly NavigationLink[] = [
    { path: '/', icon: 'home', label: 'Home', exact: true },
    { path: '/players', icon: 'groups', label: 'Players' },
    { path: '/teams', icon: 'shield', label: 'Teams' },
    { path: '/leagues', icon: 'emoji_events', label: 'Leagues' },
    { path: '/referees', icon: 'sports', label: 'Referees' },
    { path: '/stadiums', icon: 'stadium', label: 'Stadiums' },
    { path: '/databases', icon: 'storage', label: 'Databases' },
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
