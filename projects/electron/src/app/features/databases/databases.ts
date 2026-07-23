import { DatePipe } from '@angular/common';
import {
  ApplicationRef,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  form,
  FormField,
  max,
  maxLength,
  min,
  pattern,
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
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { firstValueFrom } from 'rxjs';
import { AppNavigationTrigger } from '../../core/app-navigation-trigger/app-navigation-trigger';
import { Qdb } from '../../core/qdb';
import type {
  DatabaseDescriptor,
  DatabaseSourceFileSelection,
  DatabaseSourceKind,
  DatabaseSourceSelection,
  DatabaseSourceValidationReport,
  TextDatabaseSourceSelection,
} from '../../core/qdb-contracts';
import { ConfirmDatabaseRemoval } from './confirm-database-removal';
import { SourceValidationReport } from './source-validation-report';

@Component({
  selector: 'app-databases',
  imports: [
    AppNavigationTrigger,
    DatePipe,
    FormField,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatRadioModule,
    MatSelectModule,
    MatStepperModule,
    SourceValidationReport,
  ],
  templateUrl: './databases.html',
  styleUrl: './databases.css',
})
export class Databases {
  private readonly qdb = inject(Qdb);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly applicationRef = inject(ApplicationRef);
  private readonly stepper = viewChild(MatStepper);
  private requestId = '';
  private validationRequestId = '';

  protected readonly supportedVersions = Array.from({ length: 13 }, (_, index) => 23 - index);
  protected readonly format = signal<DatabaseSourceKind>('text-folder');
  protected readonly model = signal({ name: '', version: 0 });
  protected readonly importForm = form(this.model, (path) => {
    required(path.name, { message: 'Enter a database name.' });
    pattern(path.name, /.*\S.*/, { message: 'Enter a database name.' });
    maxLength(path.name, 80, { message: 'Use at most 80 characters.' });
    min(path.version, 11, { message: 'Select the matching FIFA version.' });
    max(path.version, 23, { message: 'Select the matching FIFA version.' });
  });
  protected readonly textSource = signal<TextDatabaseSourceSelection | undefined>(undefined);
  protected readonly t3dbDatabaseFile = signal<DatabaseSourceFileSelection | undefined>(undefined);
  protected readonly t3dbMetadataFile = signal<DatabaseSourceFileSelection | undefined>(undefined);
  protected readonly selectedSource = signal<DatabaseSourceSelection | undefined>(undefined);
  protected readonly sourceReady = computed(() =>
    this.format() === 'text-folder'
      ? this.textSource() !== undefined
      : this.t3dbDatabaseFile() !== undefined && this.t3dbMetadataFile() !== undefined,
  );
  protected readonly sourcePrepared = computed(() => this.selectedSource() !== undefined);
  protected readonly sourceKindLabel = computed(() =>
    this.format() === 'text-folder' ? 'FIFA text-table folder' : 'PC t3db database',
  );
  protected readonly sourcePaths = computed(() => {
    const source = this.selectedSource();
    if (!source) return [];
    return source.kind === 'text-folder'
      ? [source.displayPath]
      : [source.databaseDisplayPath, source.metadataDisplayPath];
  });
  protected readonly sourceStatus = signal('');
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
    const source = this.selectedSource();
    if (!snapshot || !source) return undefined;
    return snapshot.selectionId === source.id && snapshot.version === this.model().version
      ? snapshot.report
      : undefined;
  });
  protected readonly sourceValidated = computed(() => this.validationReport()?.valid === true);
  protected readonly databases = signal<DatabaseDescriptor[]>([]);
  protected readonly databaseCards = computed(() =>
    this.databases().map((database) => ({
      ...database,
      versionLabel: this.formatVersionLabel(database.versions),
    })),
  );
  protected readonly loading = signal(true);
  protected readonly selecting = signal(false);
  protected readonly preparing = signal(false);
  protected readonly importing = signal(false);
  protected readonly validating = signal(false);
  protected readonly progress = signal('');
  protected readonly validationProgress = signal('');
  protected readonly busy = computed(
    () => this.selecting() || this.preparing() || this.validating() || this.importing(),
  );
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

  protected changeFormat(format: DatabaseSourceKind): void {
    if (this.format() === format) return;
    this.format.set(format);
    this.resetSource();
  }

  protected async selectTextSource(): Promise<void> {
    this.selecting.set(true);
    this.clearMessages();
    try {
      const selection = await this.qdb.selectTextDatabaseSource();
      if (!selection) return;
      this.textSource.set(selection);
      this.applySource(selection);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'The source folder could not be selected.',
      );
    } finally {
      this.selecting.set(false);
    }
  }

  protected async selectT3dbDatabase(): Promise<void> {
    await this.selectT3dbFile('database');
  }

  protected async selectT3dbMetadata(): Promise<void> {
    await this.selectT3dbFile('metadata');
  }

  protected async continueSource(): Promise<void> {
    if (!this.sourceReady() || this.busy()) return;
    if (this.format() === 'text-folder') {
      this.stepper()?.next();
      return;
    }
    const database = this.t3dbDatabaseFile();
    const metadata = this.t3dbMetadataFile();
    if (!database || !metadata) return;
    this.preparing.set(true);
    this.clearMessages();
    try {
      const result = await this.qdb.prepareT3dbDatabaseSource({
        databaseFileId: database.id,
        metadataFileId: metadata.id,
      });
      if (result.status === 'failed') {
        this.error.set(result.message);
        return;
      }
      this.applySource(result.source);
      await this.applicationRef.whenStable();
      this.stepper()?.next();
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'The t3db source could not be prepared.',
      );
    } finally {
      this.preparing.set(false);
    }
  }

  protected validateSource(): void {
    const source = this.selectedSource();
    if (!source || this.validating() || this.importing()) return;
    void submit(this.importForm, async () => {
      const selectionId = source.id;
      const version = this.model().version;
      this.clearMessages();
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
          if (selectionId === this.selectedSource()?.id && version === this.model().version)
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
    });
  }

  protected async cancelValidation(): Promise<void> {
    if (this.validationRequestId)
      await this.qdb.cancelDatabaseSourceValidation(this.validationRequestId);
  }

  protected continueToSummary(): void {
    if (this.sourceValidated()) this.stepper()?.next();
  }

  protected import(): void {
    const source = this.selectedSource();
    if (!source || !this.sourceValidated()) {
      this.error.set('Validate the selected source before importing.');
      return;
    }
    void submit(this.importForm, async () => {
      this.clearMessages();
      this.importing.set(true);
      this.progress.set('Starting import…');
      this.requestId = crypto.randomUUID();
      try {
        const result = await this.qdb.importDatabase({
          requestId: this.requestId,
          selectionId: source.id,
          name: this.model().name.trim(),
          version: this.model().version,
        });
        if (result.status === 'completed') {
          this.resetWizard();
          this.success.set(`“${result.database.name}” was imported and is ready to search.`);
          await this.load();
        } else if (result.status === 'cancelled')
          this.success.set('Import cancelled. No database was added.');
        else if (result.error.validation) {
          this.stepper()?.previous();
          this.validationSnapshot.set({
            selectionId: source.id,
            version: this.model().version,
            report: result.error.validation,
          });
        } else this.error.set(result.error.message);
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

  private async selectT3dbFile(kind: 'database' | 'metadata'): Promise<void> {
    this.selecting.set(true);
    this.clearMessages();
    try {
      const selection =
        kind === 'database'
          ? await this.qdb.selectT3dbDatabaseFile()
          : await this.qdb.selectT3dbMetadataFile();
      if (!selection) return;
      if (kind === 'database') this.t3dbDatabaseFile.set(selection);
      else this.t3dbMetadataFile.set(selection);
      this.selectedSource.set(undefined);
      this.validationSnapshot.set(undefined);
      this.sourceStatus.set('');
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'The source file could not be selected.',
      );
    } finally {
      this.selecting.set(false);
    }
  }

  private applySource(selection: DatabaseSourceSelection): void {
    this.selectedSource.set(selection);
    this.validationSnapshot.set(undefined);
    this.sourceStatus.set(
      selection.detectedVersion === undefined
        ? 'The FIFA version could not be detected. Select the matching version before validating.'
        : `Detected FIFA ${selection.detectedVersion} from the source schema. The version was selected automatically.`,
    );
    this.model.update((value) => ({
      name: selection.suggestedName,
      version: selection.detectedVersion ?? (value.version >= 11 ? value.version : 0),
    }));
  }

  private resetSource(): void {
    this.textSource.set(undefined);
    this.t3dbDatabaseFile.set(undefined);
    this.t3dbMetadataFile.set(undefined);
    this.selectedSource.set(undefined);
    this.validationSnapshot.set(undefined);
    this.sourceStatus.set('');
    this.model.set({ name: '', version: 0 });
    this.importForm().reset();
    this.clearMessages();
  }

  private resetWizard(): void {
    this.resetSource();
    this.format.set('text-folder');
    const stepper = this.stepper();
    if (stepper) stepper.selectedIndex = 0;
  }

  private clearMessages(): void {
    this.error.set('');
    this.success.set('');
  }

  private formatVersionLabel(versions: number[]): string {
    if (versions.length === 0) return 'No FIFA editions';
    const sorted = [...versions].sort((left, right) => left - right);
    if (sorted.length === 1) return `FIFA ${sorted[0]}`;
    const isContinuous = sorted.every(
      (version, index) => index === 0 || version === sorted[index - 1] + 1,
    );
    return isContinuous
      ? `FIFA ${sorted[0]}–${sorted[sorted.length - 1]}`
      : sorted.map((version) => `FIFA ${version}`).join(', ');
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
