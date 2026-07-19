import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AboutDialog } from '../about-dialog/about-dialog';

@Component({
  selector: 'app-navigation-menu',
  imports: [MatDividerModule, MatIconModule, MatMenuModule, RouterLink, RouterLinkActive],
  templateUrl: './app-navigation-menu.html',
  styleUrl: './app-navigation-menu.css',
})
export class AppNavigationMenu {
  private readonly dialog = inject(MatDialog);

  protected openAbout(): void {
    this.dialog.open(AboutDialog, {
      width: '440px',
      maxWidth: 'calc(100vw - 2rem)',
      autoFocus: 'dialog',
      restoreFocus: true,
    });
  }
}
