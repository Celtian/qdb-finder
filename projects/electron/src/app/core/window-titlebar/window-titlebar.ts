import { NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AppNavigationMenu } from '../app-navigation-menu/app-navigation-menu';
import { DatabaseContext } from '../database-context';

@Component({
  selector: 'app-window-titlebar',
  imports: [AppNavigationMenu, NgOptimizedImage, MatIconModule],
  templateUrl: './window-titlebar.html',
  styleUrl: './window-titlebar.css',
})
export class WindowTitlebar {
  protected readonly desktop = typeof window === 'undefined' ? undefined : window.qdbWindow;
  private readonly destroyRef = inject(DestroyRef);
  protected readonly databaseInfo = inject(DatabaseContext).info;
  protected readonly maximized = signal(false);

  constructor() {
    if (!this.desktop) return;
    void this.desktop.isMaximized().then((maximized) => this.maximized.set(maximized));
    const unsubscribe = this.desktop.onMaximizedChange((maximized) =>
      this.maximized.set(maximized),
    );
    this.destroyRef.onDestroy(unsubscribe);
  }

  protected minimize(): void {
    void this.desktop?.minimize();
  }

  protected toggleMaximize(): void {
    void this.desktop?.toggleMaximize();
  }

  protected close(): void {
    void this.desktop?.close();
  }
}
