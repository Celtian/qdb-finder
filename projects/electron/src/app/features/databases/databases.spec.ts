import type { WritableSignal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import type { HarnessLoader } from '@angular/cdk/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatStepperHarness } from '@angular/material/stepper/testing';
import { provideRouter } from '@angular/router';
import axe from 'axe-core';
import { of } from 'rxjs';
import { Qdb } from '../../core/qdb';
import type {
  DatabaseDescriptor,
  DatabaseImportRequest,
  DatabaseImportResult,
  DatabaseImportProgress,
  DatabaseSourceFileSelection,
  DatabaseSourceKind,
  DatabaseSourceValidationResult,
  DatabaseSourceValidationProgress,
  DatabaseSourceValidationReport,
  TextDatabaseSourceSelection,
} from '../../core/qdb-contracts';
import { Databases } from './databases';

const builtIn: DatabaseDescriptor = {
  id: 'built-in',
  name: 'Built-in FIFA 11–23',
  kind: 'built-in',
  schemaVersion: 3,
  editions: 227_572,
  teamEditions: 8_907,
  leagueEditions: 560,
  refereeEditions: 2_516,
  stadiumEditions: 1_371,
  teamLinks: 241_640,
  sourceFiles: 306,
  versions: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
  generatedAt: '2026-07-20T00:00:00.000Z',
  sqliteVersion: '3.50.0',
  status: 'available',
};

const custom: DatabaseDescriptor = {
  ...builtIn,
  id: 'custom-id',
  name: 'fifa_ng_db',
  kind: 'custom',
  editions: 22_359,
  teamEditions: 901,
  leagueEditions: 52,
  versions: [16],
};

const validReport: DatabaseSourceValidationReport = {
  valid: true,
  errorCount: 0,
  warningCount: 0,
  issues: [],
  omittedIssueGroups: 0,
};

const corruptedReport: DatabaseSourceValidationReport = {
  valid: false,
  errorCount: 1,
  warningCount: 0,
  issues: [],
  omittedIssueGroups: 0,
};

describe('Databases', () => {
  let fixture: ComponentFixture<Databases>;
  let loader: HarnessLoader;
  let progressListener: (progress: DatabaseImportProgress) => void;
  let validationProgressListener: (progress: DatabaseSourceValidationProgress) => void;
  const listDatabases = vi.fn(async () => [builtIn, custom]);
  const selectTextDatabaseSource = vi.fn<() => Promise<TextDatabaseSourceSelection | undefined>>(
    async () => ({
      id: 'text-selection',
      kind: 'text-folder',
      displayPath: '/examples/FIP16 V9.2 AFC',
      suggestedName: 'FIP16 V9.2 AFC',
      detection: 'detected',
      detectedVersion: 16,
    }),
  );
  const selectT3dbDatabaseFile = vi.fn<() => Promise<DatabaseSourceFileSelection | undefined>>(
    async () => ({
      id: 'database-file',
      displayPath: '/game/fifa_ng_db.db',
      fileName: 'fifa_ng_db.db',
    }),
  );
  const selectT3dbMetadataFile = vi.fn<() => Promise<DatabaseSourceFileSelection | undefined>>(
    async () => ({
      id: 'metadata-file',
      displayPath: '/game/fifa_ng_db-meta.xml',
      fileName: 'fifa_ng_db-meta.xml',
    }),
  );
  const prepareT3dbDatabaseSource = vi.fn(async () => ({
    status: 'completed' as const,
    source: {
      id: 't3db-selection',
      kind: 't3db' as const,
      databaseDisplayPath: '/game/fifa_ng_db.db',
      metadataDisplayPath: '/game/fifa_ng_db-meta.xml',
      suggestedName: 'fifa_ng_db',
      detection: 'detected' as const,
      detectedVersion: 16,
    },
  }));
  const importDatabase = vi.fn<(request: DatabaseImportRequest) => Promise<DatabaseImportResult>>(
    async (request) => ({
      status: 'completed',
      database: { ...builtIn, id: 'custom-id', name: request.name, kind: 'custom' },
    }),
  );
  const validateDatabaseSource = vi.fn<() => Promise<DatabaseSourceValidationResult>>(async () => ({
    status: 'completed',
    report: validReport,
  }));
  const removeDatabase = vi.fn(async () => undefined);
  const cancelDatabaseImport = vi.fn(async () => true);
  const cancelDatabaseSourceValidation = vi.fn(async () => true);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Databases],
      providers: [
        provideRouter([]),
        {
          provide: Qdb,
          useValue: {
            listDatabases,
            selectTextDatabaseSource,
            selectT3dbDatabaseFile,
            selectT3dbMetadataFile,
            prepareT3dbDatabaseSource,
            validateDatabaseSource,
            cancelDatabaseSourceValidation,
            importDatabase,
            removeDatabase,
            cancelDatabaseImport,
            onDatabaseSourceValidationProgress: (listener: typeof validationProgressListener) => {
              validationProgressListener = listener;
              return vi.fn();
            },
            onDatabaseImportProgress: (listener: typeof progressListener) => {
              progressListener = listener;
              return vi.fn();
            },
          },
        },
      ],
    }).compileComponents();
    vi.clearAllMocks();
    fixture = TestBed.createComponent(Databases);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('renders a numbered four-step wizard and installed database details', async () => {
    const stepper = await loader.getHarness(MatStepperHarness);
    expect(await Promise.all((await stepper.getSteps()).map((step) => step.getLabel()))).toEqual([
      'Format',
      'Source',
      'Validate',
      'Summary',
    ]);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Manage FIFA databases');
    expect(element.querySelector('.wizard-card .database-icon mat-icon')?.textContent?.trim()).toBe(
      'upload_file',
    );
    expect(element.textContent).toContain('Text-table folder');
    expect(element.textContent).toContain('t3db database');
    expect(element.querySelector('.database-summary')?.textContent).toContain('FIFA 11–23');
    const removeButtons = await loader.getAllHarnesses(
      MatButtonHarness.with({
        selector: '.remove-database',
        variant: 'icon',
        iconName: 'delete_outline',
      }),
    );
    expect(removeButtons).toHaveLength(1);
    expect(element.querySelector('.remove-database')?.getAttribute('aria-label')).toBe(
      'Remove fifa_ng_db',
    );
    expect(element.querySelector('mat-card-actions')).toBeNull();
    expect(validationProgressListener).toBeTypeOf('function');
  });

  it('validates and imports a text-table source before resetting the wizard', async () => {
    const testable = fixture.componentInstance as unknown as {
      format: WritableSignal<DatabaseSourceKind>;
      model: WritableSignal<{ name: string; version: number }>;
      selectTextSource(): Promise<void>;
      validateSource(): void;
      continueToSummary(): void;
      import(): void;
    };
    await testable.selectTextSource();
    expect(testable.model()).toEqual({ name: 'FIP16 V9.2 AFC', version: 16 });

    testable.validateSource();
    await fixture.whenStable();
    expect(validateDatabaseSource).toHaveBeenCalledWith(
      expect.objectContaining({ selectionId: 'text-selection', version: 16 }),
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Source validation completed',
    );

    testable.model.update((value) => ({ ...value, name: ' Custom FIFA 16 ' }));
    testable.continueToSummary();
    testable.import();
    progressListener({ requestId: '', message: 'Building canonical data…' });
    await fixture.whenStable();

    expect(importDatabase).toHaveBeenCalledWith(
      expect.objectContaining({
        selectionId: 'text-selection',
        name: 'Custom FIFA 16',
        version: 16,
      }),
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'was imported and is ready to search',
    );
    expect(testable.model()).toEqual({ name: '', version: 0 });
    expect(testable.format()).toBe('text-folder');
    const [selectedStep] = await (
      await loader.getHarness(MatStepperHarness)
    ).getSteps({ selected: true });
    expect(await selectedStep.getLabel()).toBe('Format');
  });

  it('pairs both t3db files through opaque ids and detects the FIFA edition', async () => {
    const stepper = await loader.getHarness(MatStepperHarness);
    await stepper.selectStep({ label: 'Source' });
    const testable = fixture.componentInstance as unknown as {
      model: WritableSignal<{ name: string; version: number }>;
      changeFormat(format: DatabaseSourceKind): void;
      selectT3dbDatabase(): Promise<void>;
      selectT3dbMetadata(): Promise<void>;
      continueSource(): Promise<void>;
    };
    testable.changeFormat('t3db');
    await testable.selectT3dbDatabase();
    await testable.selectT3dbMetadata();
    await testable.continueSource();
    await fixture.whenStable();

    expect(prepareT3dbDatabaseSource).toHaveBeenCalledWith({
      databaseFileId: 'database-file',
      metadataFileId: 'metadata-file',
    });
    expect(testable.model()).toEqual({ name: 'fifa_ng_db', version: 16 });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Detected FIFA 16 from the source schema',
    );
    const [selectedStep] = await stepper.getSteps({ selected: true });
    expect(await selectedStep.getLabel()).toBe('Validate');
    expect(prepareT3dbDatabaseSource).toHaveBeenCalledTimes(1);
  });

  it('requires a manual edition when source detection is uncertain', async () => {
    selectTextDatabaseSource.mockResolvedValueOnce({
      id: 'edited-source',
      kind: 'text-folder',
      displayPath: '/examples/Edited database',
      suggestedName: 'Edited database',
      detection: 'unknown',
      detectedVersion: undefined,
    });
    const testable = fixture.componentInstance as unknown as {
      model: WritableSignal<{ name: string; version: number }>;
      selectTextSource(): Promise<void>;
      validateSource(): void;
    };

    await testable.selectTextSource();
    testable.validateSource();
    await fixture.whenStable();

    expect(testable.model()).toEqual({ name: 'Edited database', version: 0 });
    expect(validateDatabaseSource).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'The FIFA version could not be detected',
    );

    testable.model.update((value) => ({ ...value, version: 16 }));
    testable.validateSource();
    await fixture.whenStable();

    expect(validateDatabaseSource).toHaveBeenCalledWith(
      expect.objectContaining({ selectionId: 'edited-source', version: 16 }),
    );
  });

  it('preserves state when source pickers are cancelled', async () => {
    selectTextDatabaseSource.mockResolvedValueOnce(undefined);
    selectT3dbDatabaseFile.mockResolvedValueOnce(undefined);
    const testable = fixture.componentInstance as unknown as {
      model: WritableSignal<{ name: string; version: number }>;
      changeFormat(format: DatabaseSourceKind): void;
      selectTextSource(): Promise<void>;
      selectT3dbDatabase(): Promise<void>;
      continueSource(): Promise<void>;
    };

    await testable.selectTextSource();
    expect(testable.model()).toEqual({ name: '', version: 0 });

    testable.changeFormat('t3db');
    await testable.selectT3dbDatabase();
    await testable.continueSource();

    expect(prepareT3dbDatabaseSource).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).toBeNull();
  });

  it('shows record locations for blocking t3db validation errors', async () => {
    validateDatabaseSource.mockResolvedValueOnce({
      status: 'completed',
      report: {
        valid: false,
        errorCount: 1,
        warningCount: 0,
        issues: [
          {
            severity: 'error',
            code: 'duplicate-value',
            file: 'players table',
            field: 'playerid',
            message: 'Canonical identifier 1 occurs more than once.',
            count: 2,
            samples: [{ record: 2, value: '1' }],
          },
        ],
        omittedIssueGroups: 0,
      },
    });
    const testable = fixture.componentInstance as unknown as {
      selectTextSource(): Promise<void>;
      validateSource(): void;
    };
    await testable.selectTextSource();
    testable.validateSource();
    await fixture.whenStable();

    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('players table · playerid');
    expect(alert?.textContent).toContain('Record 2');
    expect(importDatabase).not.toHaveBeenCalled();
  });

  it('invalidates validation when the FIFA edition changes', async () => {
    const testable = fixture.componentInstance as unknown as {
      model: WritableSignal<{ name: string; version: number }>;
      selectTextSource(): Promise<void>;
      validateSource(): void;
    };
    await testable.selectTextSource();
    testable.validateSource();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Source validation completed',
    );

    testable.model.update((value) => ({ ...value, version: 17 }));
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain(
      'Source validation completed',
    );
  });

  it('carries validation warnings into the import summary', async () => {
    validateDatabaseSource.mockResolvedValueOnce({
      status: 'completed',
      report: {
        ...validReport,
        warningCount: 1,
        issues: [
          {
            severity: 'warning',
            code: 'out-of-range',
            file: 'players.txt',
            field: 'overallrating',
            message: 'Value is outside the published range 0–99.',
            count: 1,
            samples: [{ line: 2, value: '100' }],
          },
        ],
      },
    });
    const testable = fixture.componentInstance as unknown as {
      selectTextSource(): Promise<void>;
      validateSource(): void;
      continueToSummary(): void;
    };
    await testable.selectTextSource();
    testable.validateSource();
    await fixture.whenStable();
    testable.continueToSummary();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('1 warning');
  });

  it('forwards validation cancellation for the active request', async () => {
    const testable = fixture.componentInstance as unknown as {
      validationRequestId: string;
      cancelValidation(): Promise<void>;
    };
    testable.validationRequestId = 'validation-request';

    await testable.cancelValidation();

    expect(cancelDatabaseSourceValidation).toHaveBeenCalledWith('validation-request');
  });

  it('ignores unrelated progress and forwards progress and cancellation for active requests', async () => {
    const testable = fixture.componentInstance as unknown as {
      requestId: string;
      validationRequestId: string;
      importing: WritableSignal<boolean>;
      progress: WritableSignal<string>;
      validationProgress: WritableSignal<string>;
      cancelImport(): Promise<void>;
      cancelValidation(): Promise<void>;
    };
    testable.requestId = 'import-request';
    testable.validationRequestId = 'validation-request';
    testable.importing.set(true);

    progressListener({ requestId: 'other-request', message: 'Ignored import progress' });
    validationProgressListener({
      requestId: 'other-request',
      message: 'Ignored validation progress',
    });
    expect(testable.progress()).toBe('');
    expect(testable.validationProgress()).toBe('');

    progressListener({ requestId: 'import-request', message: 'Importing players…' });
    validationProgressListener({
      requestId: 'validation-request',
      message: 'Checking players…',
    });
    await fixture.whenStable();
    await testable.cancelImport();
    await testable.cancelValidation();

    expect(testable.progress()).toBe('Importing players…');
    expect(testable.validationProgress()).toBe('Checking players…');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Importing players…');
    expect(cancelDatabaseImport).toHaveBeenCalledWith('import-request');
    expect(cancelDatabaseSourceValidation).toHaveBeenCalledWith('validation-request');

    testable.requestId = '';
    testable.validationRequestId = '';
    await testable.cancelImport();
    await testable.cancelValidation();
    expect(cancelDatabaseImport).toHaveBeenCalledOnce();
    expect(cancelDatabaseSourceValidation).toHaveBeenCalledOnce();
  });

  it('handles cancelled selection and validation guard conditions', async () => {
    selectTextDatabaseSource.mockResolvedValueOnce(undefined);
    const testable = fixture.componentInstance as unknown as {
      validating: WritableSignal<boolean>;
      importing: WritableSignal<boolean>;
      selectTextSource(): Promise<void>;
      validateSource(): void;
    };

    await testable.selectTextSource();
    testable.validateSource();
    await fixture.whenStable();
    expect(validateDatabaseSource).not.toHaveBeenCalled();

    await testable.selectTextSource();
    testable.validating.set(true);
    testable.validateSource();
    testable.validating.set(false);
    testable.importing.set(true);
    testable.validateSource();

    expect(validateDatabaseSource).not.toHaveBeenCalled();
  });

  it('reports cancelled, failed, stale, and exceptional source validations', async () => {
    const testable = fixture.componentInstance as unknown as {
      model: WritableSignal<{ name: string; version: number }>;
      success: WritableSignal<string>;
      error: WritableSignal<string>;
      validationReport(): DatabaseSourceValidationReport | undefined;
      selectTextSource(): Promise<void>;
      validateSource(): void;
    };
    await testable.selectTextSource();

    validateDatabaseSource.mockResolvedValueOnce({ status: 'cancelled' });
    testable.validateSource();
    await fixture.whenStable();
    expect(testable.success()).toBe('Source validation cancelled.');

    validateDatabaseSource.mockResolvedValueOnce({ status: 'failed', message: 'Invalid headers.' });
    testable.validateSource();
    await fixture.whenStable();
    expect(testable.error()).toBe('Invalid headers.');

    validateDatabaseSource.mockImplementationOnce(async () => {
      testable.model.update((value) => ({ ...value, version: value.version + 1 }));
      return { status: 'completed', report: validReport };
    });
    testable.validateSource();
    await fixture.whenStable();
    expect(testable.validationReport()).toBeUndefined();

    validateDatabaseSource.mockRejectedValueOnce(new Error('Validation crashed.'));
    testable.validateSource();
    await fixture.whenStable();
    expect(testable.error()).toBe('Validation crashed.');

    validateDatabaseSource.mockRejectedValueOnce('unexpected failure');
    testable.validateSource();
    await fixture.whenStable();
    expect(testable.error()).toBe('Source validation failed.');
  });

  it('handles import preconditions and every non-completed import result', async () => {
    const testable = fixture.componentInstance as unknown as {
      model: WritableSignal<{ name: string; version: number }>;
      error: WritableSignal<string>;
      success: WritableSignal<string>;
      validationReport(): DatabaseSourceValidationReport | undefined;
      selectTextSource(): Promise<void>;
      validateSource(): void;
      import(): void;
    };

    testable.import();
    expect(testable.error()).toBe('Validate the selected source before importing.');
    expect(importDatabase).not.toHaveBeenCalled();

    await testable.selectTextSource();
    testable.validateSource();
    await fixture.whenStable();
    testable.model.update((value) => ({ ...value, name: 'Custom database' }));

    importDatabase.mockResolvedValueOnce({ status: 'cancelled' });
    testable.import();
    await fixture.whenStable();
    expect(testable.success()).toBe('Import cancelled. No database was added.');

    importDatabase.mockResolvedValueOnce({
      status: 'failed',
      error: { code: 'import-failed', message: 'Import was rejected.', files: [] },
    });
    testable.import();
    await fixture.whenStable();
    expect(testable.error()).toBe('Import was rejected.');

    importDatabase.mockRejectedValueOnce(new Error('Import crashed.'));
    testable.import();
    await fixture.whenStable();
    expect(testable.error()).toBe('Import crashed.');

    importDatabase.mockRejectedValueOnce('unexpected failure');
    testable.import();
    await fixture.whenStable();
    expect(testable.error()).toBe('Database import failed.');

    importDatabase.mockResolvedValueOnce({
      status: 'failed',
      error: {
        code: 'source-corrupted',
        message: 'Source is corrupted.',
        files: ['players.txt'],
        validation: corruptedReport,
      },
    });
    testable.import();
    await fixture.whenStable();
    expect(testable.validationReport()).toBe(corruptedReport);
  });

  it('formats empty, singular, and non-contiguous edition ranges', () => {
    const testable = fixture.componentInstance as unknown as {
      formatVersionLabel(versions: number[]): string;
    };

    expect(testable.formatVersionLabel([])).toBe('No FIFA editions');
    expect(testable.formatVersionLabel([16])).toBe('FIFA 16');
    expect(testable.formatVersionLabel([23, 16])).toBe('FIFA 16, FIFA 23');
  });

  it('honors database-removal cancellation and confirmation', async () => {
    const dialog = TestBed.inject(MatDialog);
    const open = vi.spyOn(dialog, 'open');
    const testable = fixture.componentInstance as unknown as {
      remove(database: DatabaseDescriptor): Promise<void>;
    };

    open.mockReturnValueOnce({ afterClosed: () => of(false) } as never);
    await testable.remove(builtIn);
    expect(removeDatabase).not.toHaveBeenCalled();

    open.mockReturnValueOnce({ afterClosed: () => of(true) } as never);
    await testable.remove(builtIn);
    expect(removeDatabase).toHaveBeenCalledWith(builtIn.id);
    expect(listDatabases).toHaveBeenCalledTimes(2);
  });

  it('does not expose activation controls', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Activate');
  });

  it('has no detectable AXE violations', async () => {
    const results = await axe.run(fixture.nativeElement as HTMLElement);

    expect(results.violations).toEqual([]);
  });
});
