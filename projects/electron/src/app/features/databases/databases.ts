import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import {
  form,
  FormField,
  max,
  maxLength,
  min,
  pattern,
  readonly,
  required,
  submit,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';
import { Qdb } from '../../core/qdb';
import type { DatabaseDescriptor } from '../../core/qdb-contracts';
import { ConfirmDatabaseRemoval } from './confirm-database-removal';

@Component({
  selector: 'app-databases',
  imports: [
    DatePipe,
    FormField,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './databases.html',
  styleUrl: './databases.css',
})
export class Databases {
  private readonly qdb = inject(Qdb);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private selectionId = '';
  private requestId = '';

  protected readonly supportedVersions = Array.from({ length: 13 }, (_, index) => 23 - index);
  protected readonly model = signal({ name: '', version: 23, folder: '' });
  protected readonly importForm = form(this.model, (path) => {
    required(path.name, { message: 'Enter a database name.' });
    pattern(path.name, /.*\S.*/, { message: 'Enter a database name.' });
    maxLength(path.name, 80, { message: 'Use at most 80 characters.' });
    min(path.version, 11);
    max(path.version, 23);
    required(path.folder, { message: 'Select a FIFA text folder.' });
    readonly(path.folder);
  });
  protected readonly databases = signal<DatabaseDescriptor[]>([]);
  protected readonly loading = signal(true);
  protected readonly importing = signal(false);
  protected readonly progress = signal('');
  protected readonly sourceStatus = signal('');
  protected readonly sourceSelected = computed(() => this.model().folder.length > 0);
  protected readonly error = signal('');
  protected readonly success = signal('');

  constructor() {
    const unsubscribe = this.qdb.onDatabaseImportProgress((progress) => {
      if (progress.requestId === this.requestId) this.progress.set(progress.message);
    });
    this.destroyRef.onDestroy(unsubscribe);
    void this.load();
  }

  protected async selectFolder(): Promise<void> {
    const selection = await this.qdb.selectDatabaseSource();
    if (!selection) return;
    this.selectionId = selection.id;
    this.error.set('');
    this.sourceStatus.set(
      selection.detectedVersion === undefined
        ? 'The FIFA version could not be detected. Select the matching version before importing.'
        : `Detected FIFA ${selection.detectedVersion} from the folder headers. The version was selected automatically.`,
    );
    this.model.update((value) => ({
      ...value,
      name: selection.folderName,
      folder: selection.displayPath,
      version: selection.detectedVersion ?? value.version,
    }));
  }

  protected import(): void {
    void submit(this.importForm, async () => {
      this.error.set('');
      this.success.set('');
      this.importing.set(true);
      this.progress.set('Starting import…');
      this.requestId = crypto.randomUUID();
      try {
        const result = await this.qdb.importDatabase({
          requestId: this.requestId,
          selectionId: this.selectionId,
          name: this.model().name.trim(),
          version: this.model().version,
        });
        if (result.status === 'completed') {
          this.success.set(`“${result.database.name}” was imported and activated.`);
          this.selectionId = '';
          this.sourceStatus.set('');
          this.model.set({ name: '', version: this.model().version, folder: '' });
          this.importForm().reset();
          await this.load();
        } else if (result.status === 'cancelled')
          this.success.set('Import cancelled. No database was added.');
        else this.error.set(result.error.message);
      } catch (error) {
        this.error.set(error instanceof Error ? error.message : 'Database import failed.');
      } finally {
        this.importing.set(false);
        this.progress.set('');
        this.requestId = '';
      }
    });
  }

  protected async cancelImport(): Promise<void> {
    if (this.requestId) await this.qdb.cancelDatabaseImport(this.requestId);
  }

  protected async activate(database: DatabaseDescriptor): Promise<void> {
    if (database.active || database.status !== 'available') return;
    this.error.set('');
    try {
      await this.qdb.activateDatabase(database.id);
      await this.load();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Database could not be activated.');
    }
  }

  protected async remove(database: DatabaseDescriptor): Promise<void> {
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDatabaseRemoval, {
          data: database,
          width: '440px',
          maxWidth: 'calc(100vw - 2rem)',
          autoFocus: 'dialog',
          restoreFocus: true,
        })
        .afterClosed(),
    );
    if (!confirmed) return;
    this.error.set('');
    try {
      await this.qdb.removeDatabase(database.id);
      await this.load();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Database could not be removed.');
    }
  }

  protected retry(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.databases.set(await this.qdb.listDatabases());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Database library is unavailable.');
    } finally {
      this.loading.set(false);
    }
  }
}
