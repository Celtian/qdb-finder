import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { firstValueFrom } from 'rxjs';
import { AppNavigationTrigger } from '../../core/app-navigation-trigger/app-navigation-trigger';
import { DatabaseContext } from '../../core/database-context';
import { FinderPreferences } from '../../core/finder-preferences';
import { Qdb } from '../../core/qdb';
import type { DatabaseDescriptor } from '../../core/qdb-contracts';
import { ThemePreferences, type ThemePreference } from '../../core/theme-preferences';

interface ThemeOption {
  value: ThemePreference;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-confirm-preference-reset',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  templateUrl: './confirm-preference-reset.html',
})
export class ConfirmPreferenceReset {}

@Component({
  selector: 'app-confirm-custom-database-removal',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  templateUrl: './confirm-custom-database-removal.html',
})
export class ConfirmCustomDatabaseRemoval {
  protected readonly data = inject<DatabaseDescriptor[]>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-settings',
  imports: [AppNavigationTrigger, MatButtonModule, MatCardModule, MatIconModule, MatRadioModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private readonly dialog = inject(MatDialog);
  private readonly qdb = inject(Qdb);
  private readonly databaseContext = inject(DatabaseContext);
  private readonly finderPreferences = inject(FinderPreferences);
  protected readonly theme = inject(ThemePreferences);

  protected readonly themeOptions: readonly ThemeOption[] = [
    {
      value: 'system',
      label: 'System',
      description: 'Match the light or dark appearance selected in your operating system.',
      icon: 'desktop_windows',
    },
    {
      value: 'light',
      label: 'Light',
      description: 'Always use the light application theme.',
      icon: 'light_mode',
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Always use the dark application theme.',
      icon: 'dark_mode',
    },
  ];
  protected readonly loading = signal(true);
  protected readonly removing = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly customDatabases = computed(() =>
    this.databaseContext.databases().filter((database) => database.kind === 'custom'),
  );

  constructor() {
    void this.loadDatabases();
  }

  protected setTheme(preference: ThemePreference): void {
    this.theme.set(preference);
    this.showSuccess(`Theme set to ${preference}.`);
  }

  protected async resetFinderPreferences(): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmPreferenceReset, {
          width: '440px',
          maxWidth: 'calc(100vw - 2rem)',
          autoFocus: 'dialog',
          restoreFocus: true,
        })
        .afterClosed(),
    );
    if (!confirmed) return;
    this.finderPreferences.resetAll();
    this.showSuccess('All saved finder filters and columns were reset.');
  }

  protected async removeCustomDatabases(): Promise<void> {
    const databases = this.customDatabases();
    if (!databases.length || this.removing()) return;
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmCustomDatabaseRemoval, {
          data: databases,
          width: '500px',
          maxWidth: 'calc(100vw - 2rem)',
          autoFocus: 'dialog',
          restoreFocus: true,
        })
        .afterClosed(),
    );
    if (!confirmed) return;
    this.error.set('');
    this.success.set('');
    this.removing.set(true);
    try {
      const removedIds = await this.qdb.removeCustomDatabases();
      this.finderPreferences.resetFilters();
      this.showSuccess(
        `${removedIds.length} custom ${removedIds.length === 1 ? 'database was' : 'databases were'} removed. Saved finder filters were reset.`,
      );
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Custom databases could not be removed.',
      );
    } finally {
      this.removing.set(false);
    }
  }

  protected retry(): void {
    void this.loadDatabases();
  }

  private async loadDatabases(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.qdb.listDatabases();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Database library is unavailable.');
    } finally {
      this.loading.set(false);
    }
  }

  private showSuccess(message: string): void {
    this.error.set('');
    this.success.set(message);
  }
}
