import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import type { WritableSignal } from '@angular/core';
import { Qdb } from '../../core/qdb';
import type {
  DatabaseDescriptor,
  DatabaseImportProgress,
  DatabaseSourceSelection,
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
  active: true,
  status: 'available',
};

describe('Databases', () => {
  let fixture: ComponentFixture<Databases>;
  let progressListener: (progress: DatabaseImportProgress) => void;
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
  const activateDatabase = vi.fn(async () => builtIn);
  const removeDatabase = vi.fn(async () => builtIn);
  const cancelDatabaseImport = vi.fn(async () => true);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Databases],
      providers: [
        {
          provide: Qdb,
          useValue: {
            listDatabases,
            selectDatabaseSource,
            importDatabase,
            activateDatabase,
            removeDatabase,
            cancelDatabaseImport,
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
    importDatabase.mockClear();
    activateDatabase.mockClear();
    fixture = TestBed.createComponent(Databases);
    await fixture.whenStable();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('initially shows only the source folder field', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Manage FIFA databases');
    expect(element.textContent).toContain('Built-in FIFA 11–23');
    expect(element.textContent).toContain('Active');
    expect(element.textContent).toContain('Source folder');
    expect(element.textContent).not.toContain('Database name');
    expect(element.textContent).not.toContain('FIFA version');
    expect(element.textContent).not.toContain('Import and activate');
  });

  it('fills the name and detected version from the folder before importing', async () => {
    const testable = fixture.componentInstance as unknown as {
      model: WritableSignal<{ name: string; version: number; folder: string }>;
      selectFolder(): Promise<void>;
      import(): void;
    };
    await testable.selectFolder();
    expect(testable.model().name).toBe('FIP16 V9.2 AFC');
    expect(testable.model().version).toBe(16);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Database name');
    expect(element.textContent).toContain('FIFA version');
    expect(element.textContent).toContain('Import and activate');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Detected FIFA 16 from the folder headers',
    );
    testable.model.update((value) => ({ ...value, name: ' Custom FIFA 23 ' }));
    testable.import();
    progressListener({ requestId: '', message: 'Building canonical data…' });
    await fixture.whenStable();

    expect(selectDatabaseSource).toHaveBeenCalledOnce();
    expect(importDatabase).toHaveBeenCalledWith(
      expect.objectContaining({
        selectionId: 'selection-id',
        name: 'Custom FIFA 23',
        version: 16,
      }),
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'was imported and activated',
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

  it('shows a friendly validation failure and retains the selected form values', async () => {
    importDatabase.mockResolvedValueOnce({
      status: 'failed',
      error: {
        code: 'version-mismatch',
        message: 'This folder appears to be FIFA 16, but FIFA 23 is selected.',
        files: ['competition.txt'],
        detectedVersion: 16,
      },
    } as never);
    const testable = fixture.componentInstance as unknown as {
      model: WritableSignal<{ name: string; version: number; folder: string }>;
      selectFolder(): Promise<void>;
      import(): void;
    };
    await testable.selectFolder();
    testable.model.set({ name: 'Custom database', version: 23, folder: '/examples/fifa16' });

    testable.import();
    await fixture.whenStable();

    expect(testable.model()).toEqual({
      name: 'Custom database',
      version: 23,
      folder: '/examples/fifa16',
    });
    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('appears to be FIFA 16');
    expect(alert?.textContent).not.toContain('Error invoking remote method');
  });

  it('activates an available custom database', async () => {
    const testable = fixture.componentInstance as unknown as {
      activate(database: DatabaseDescriptor): Promise<void>;
    };
    await testable.activate({ ...builtIn, id: 'custom-id', kind: 'custom', active: false });

    expect(activateDatabase).toHaveBeenCalledWith('custom-id');
    expect(listDatabases).toHaveBeenCalled();
  });
});
