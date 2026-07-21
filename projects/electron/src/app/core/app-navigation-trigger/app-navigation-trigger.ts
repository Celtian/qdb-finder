import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AppNavigationState } from '../app-navigation-state';

@Component({
  selector: 'app-navigation-trigger',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './app-navigation-trigger.html',
  styleUrl: './app-navigation-trigger.css',
  host: { '[class.visible]': 'navigation.isSmallScreen()' },
})
export class AppNavigationTrigger {
  protected readonly navigation = inject(AppNavigationState);

  protected open(event: MouseEvent): void {
    this.navigation.open(event.currentTarget as HTMLElement);
  }
}
