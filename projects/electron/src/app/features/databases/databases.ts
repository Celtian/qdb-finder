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
import { AppNavigationMenu } from '../../core/app-navigation-menu/app-navigation-menu';
import { Qdb } from '../../core/qdb';
import type { DatabaseDescriptor } from '../../core/qdb-contracts';
import { ConfirmDatabaseRemoval } from './confirm-database-removal';
import { SourceValidationReport } from './source-validation-report';
import type { DatabaseSourceValidationReport } from '../../core/qdb-contracts';

@Component({
  selector: 'app-databases',
  imports: [
    AppNavigationMenu,
    DatePipe,
    FormField,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    SourceValidationReport,
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
  private validationRequestId = '';

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
  protected readonly validating = signal(false);
  protected readonly progress = signal('');
  protected readonly validationProgress = signal('');
  protected readonly sourceStatus = signal('');
  protected readonly sourceSelected = computed(() => this.model().folder.length > 0);
  private readonly validationSnapshot = signal<
    | {
        selectionId: string;
        version: number;
        report: DatabaseSourceValidationReport;
      }
    | undefined
  >(undefined);
  protected readonly validationReport = computed(() => {
    const snapshot = this.validationSnapshot();
    return snapshot?.selectionId === this.selectionId && snapshot.version === this.model().version
      ? snapshot.report
      : undefined;
  });
  protected readonly sourceValidated = computed(() => this.validationReport()?.valid === true);
  protected readonly busy = computed(() => this.validating() || this.importing());
  protected readonly error = signal('');
  protected readonly success = signal('');

  constructor() {
    const unsubscribe = this.qdb.onDatabaseImportProgress((progress) => {
      if (progress.requestId === this.requestId) this.progress.set(progress.message);
    });
    const unsubscribeValidation = this.qdb.onDatabaseSourceValidationProgress((progress) => {
      if (progress.requestId === this.validationRequestId)
        this.validationProgress.set(progress.message);
    });
    this.destroyRef.onDestroy(() => {
      unsubscribe();
      unsubscribeValidation();
    });
    void this.load();
  }

  protected async selectFolder(): Promise<void> {
    const selection = await this.qdb.selectDatabaseSource();
    if (!selection) return;
    this.selectionId = selection.id;
    this.validationSnapshot.set(undefined);
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

  protected async validateSource(): Promise<void> {
    if (!this.selectionId || this.validating() || this.importing()) return;
    const selectionId = this.selectionId;
    const version = this.model().version;
    this.error.set('');
    this.success.set('');
    this.validationSnapshot.set(undefined);
    this.validating.set(true);
    this.validationProgress.set('Starting source validation…');
    this.validationRequestId = crypto.randomUUID();
    try {
      const result = await this.qdb.validateDatabaseSource({
        requestId: this.validationRequestId,
        selectionId,
        version,
      });
      if (result.status === 'completed') {
        if (selectionId === this.selectionId && version === this.model().version)
          this.validationSnapshot.set({ selectionId, version, report: result.report });
      } else if (result.status === 'cancelled') this.success.set('Source validation cancelled.');
      else this.error.set(result.message);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Source validation failed.');
    } finally {
      this.validating.set(false);
      this.validationProgress.set('');
      this.validationRequestId = '';
    }
  }

  protected async cancelValidation(): Promise<void> {
    if (this.validationRequestId)
      await this.qdb.cancelDatabaseSourceValidation(this.validationRequestId);
  }

  protected import(): void {
    if (!this.sourceValidated()) {
      this.error.set('Validate the selected source before importing.');
      return;
    }
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
          this.success.set(`“${result.database.name}” was imported and is ready to search.`);
          this.selectionId = '';
          this.validationSnapshot.set(undefined);
          this.sourceStatus.set('');
          this.model.set({ name: '', version: this.model().version, folder: '' });
          this.importForm().reset();
          await this.load();
        } else if (result.status === 'cancelled')
          this.success.set('Import cancelled. No database was added.');
        else {
          if (result.error.validation) {
            this.validationSnapshot.set({
              selectionId: this.selectionId,
              version: this.model().version,
              report: result.error.validation,
            });
          } else this.error.set(result.error.message);
        }
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
