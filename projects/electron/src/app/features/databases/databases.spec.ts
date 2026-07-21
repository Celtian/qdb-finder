import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import type { WritableSignal } from '@angular/core';
import { Qdb } from '../../core/qdb';
import type {
  DatabaseDescriptor,
  DatabaseImportProgress,
  DatabaseSourceSelection,
  DatabaseSourceValidationProgress,
  DatabaseSourceValidationReport,
} from '../../core/qdb-contracts';
import { Databases } from './databases';

const builtIn: DatabaseDescriptor = {
  id: 'built-in',
  name: 'Built-in FIFA 11–23',
  kind: 'built-in',
  schemaVersion: 1,
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

const validReport: DatabaseSourceValidationReport = {
  valid: true,
  errorCount: 0,
  warningCount: 0,
  issues: [],
  omittedIssueGroups: 0,
};

const corruptedReport: DatabaseSourceValidationReport = {
  valid: false,
  errorCount: 2,
  warningCount: 14_366,
  issues: [
    {
      severity: 'error',
      code: 'duplicate-value',
      file: 'referee.txt',
      field: 'refereeid',
      message: 'Canonical identifier 56 occurs more than once.',
      count: 2,
      samples: [
        { line: 57, value: '56' },
        { line: 58, value: '56' },
      ],
    },
  ],
  omittedIssueGroups: 0,
};

describe('Databases', () => {
  let fixture: ComponentFixture<Databases>;
  let progressListener: (progress: DatabaseImportProgress) => void;
  let validationProgressListener: (progress: DatabaseSourceValidationProgress) => void;
  const listDatabases = vi.fn(async () => [builtIn]);
  const selectDatabaseSource = vi.fn<() => Promise<DatabaseSourceSelection | undefined>>(
    async () => ({
      id: 'selection-id',
      displayPath: '/examples/FIP16 V9.2 AFC',
      folderName: 'FIP16 V9.2 AFC',
      detection: 'detected',
      detectedVersion: 16,
    }),
  );
  const importDatabase = vi.fn(async (request: { name: string }) => ({
    status: 'completed' as const,
    database: { ...builtIn, id: 'custom-id', name: request.name, kind: 'custom' as const },
  }));
  const validateDatabaseSource = vi.fn(async () => ({
    status: 'completed' as const,
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
            selectDatabaseSource,
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
    listDatabases.mockClear();
    selectDatabaseSource.mockClear();
    validateDatabaseSource.mockClear();
    importDatabase.mockClear();
    fixture = TestBed.createComponent(Databases);
    await fixture.whenStable();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('initially shows only the source folder field', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[aria-label="Open main navigation"]')).toBeTruthy();
    expect(element.textContent).toContain('Manage FIFA databases');
    expect(element.textContent).toContain('Built-in FIFA 11–23');
    expect(element.textContent).not.toContain('Activate');
    expect(element.textContent).toContain('Source folder');
    expect(element.textContent).not.toContain('Database name');
    expect(element.textContent).not.toContain('FIFA version');
    expect(element.querySelector('button[type="submit"]')).toBeNull();
    expect(validationProgressListener).toBeTypeOf('function');
  });

  it('requires successful source validation before importing', async () => {
    const testable = fixture.componentInstance as unknown as {
      model: WritableSignal<{ name: string; version: number; folder: string }>;
      selectFolder(): Promise<void>;
      validateSource(): Promise<void>;
      import(): void;
    };
    await testable.selectFolder();
    expect(testable.model().name).toBe('FIP16 V9.2 AFC');
    expect(testable.model().version).toBe(16);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Database name');
    expect(element.textContent).toContain('FIFA version');
    expect(element.textContent).toContain('Validate source');
    expect(element.querySelector('button[type="submit"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Detected FIFA 16 from the folder headers',
    );
    await testable.validateSource();
    await fixture.whenStable();
    expect(validateDatabaseSource).toHaveBeenCalledWith(
      expect.objectContaining({ selectionId: 'selection-id', version: 16 }),
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Source validation completed',
    );
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]'),
    ).not.toBeNull();

    testable.model.update((value) => ({ ...value, name: ' Custom FIFA 16 ' }));
    testable.import();
    progressListener({ requestId: '', message: 'Building canonical data…' });
    await fixture.whenStable();

    expect(selectDatabaseSource).toHaveBeenCalledOnce();
    expect(importDatabase).toHaveBeenCalledWith(
      expect.objectContaining({
        selectionId: 'selection-id',
        name: 'Custom FIFA 16',
        version: 16,
      }),
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'was imported and is ready to search',
    );
  });

  it('fills the folder name but keeps the current version when detection is uncertain', async () => {
    selectDatabaseSource.mockResolvedValueOnce({
      id: 'selection-id',
      displayPath: '/examples/Edited database',
      folderName: 'Edited database',
      detection: 'unknown',
    });
    const testable = fixture.componentInstance as unknown as {
      model: WritableSignal<{ name: string; version: number; folder: string }>;
      selectFolder(): Promise<void>;
    };

    await testable.selectFolder();
    await fixture.whenStable();

    expect(testable.model()).toEqual({
      name: 'Edited database',
      version: 23,
      folder: '/examples/Edited database',
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'The FIFA version could not be detected',
    );
  });

  it('shows blocking corruption details and does not enable import', async () => {
    validateDatabaseSource.mockResolvedValueOnce({
      status: 'completed',
      report: corruptedReport,
    });
    const testable = fixture.componentInstance as unknown as {
      model: WritableSignal<{ name: string; version: number; folder: string }>;
      selectFolder(): Promise<void>;
      validateSource(): Promise<void>;
    };
    await testable.selectFolder();
    testable.model.set({ name: 'Custom database', version: 16, folder: '/examples/fifa16' });

    await testable.validateSource();
    await fixture.whenStable();

    expect(testable.model()).toEqual({
      name: 'Custom database',
      version: 16,
      folder: '/examples/fifa16',
    });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Source data is corrupted');
    expect(alert?.textContent).toContain('referee.txt · refereeid');
    expect(alert?.textContent).toContain('Line 57');
    expect(alert?.textContent).toContain('14366 warnings');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]'),
    ).toBeNull();
    expect(importDatabase).not.toHaveBeenCalled();
  });

  it('allows import with advisory warnings', async () => {
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
            field: 'nameid',
            message: 'Value is outside the published range 1–32767.',
            count: 1,
            samples: [{ line: 20, value: '32768' }],
          },
        ],
      },
    });
    const testable = fixture.componentInstance as unknown as {
      selectFolder(): Promise<void>;
      validateSource(): Promise<void>;
    };

    await testable.selectFolder();
    await testable.validateSource();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('1 warning found');
    expect(element.querySelector('button[type="submit"]')).not.toBeNull();
    expect(element.querySelector('app-source-validation-report [role="status"]')).not.toBeNull();
  });

  it('invalidates a successful report when the FIFA version changes', async () => {
    const testable = fixture.componentInstance as unknown as {
      model: WritableSignal<{ name: string; version: number; folder: string }>;
      selectFolder(): Promise<void>;
      validateSource(): Promise<void>;
    };
    await testable.selectFolder();
    await testable.validateSource();
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]'),
    ).not.toBeNull();

    testable.model.update((value) => ({ ...value, version: 17 }));
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).not.toContain('Source validation completed');
    expect(element.querySelector('button[type="submit"]')).toBeNull();
    expect(element.textContent).toContain('Validate source');
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

  it('does not expose activation controls', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Activate');
  });
});
