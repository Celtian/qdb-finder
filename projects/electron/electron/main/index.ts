import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  shell,
  type IpcMainInvokeEvent,
  type OpenDialogOptions,
} from 'electron';
import { randomUUID } from 'node:crypto';
import { basename, extname, join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { updateElectronApp } from 'update-electron-app';
import type {
  EntityFacetRequest,
  DatabaseImportRequest,
  DatabaseImportResult,
  DatabaseImportError,
  DatabaseSourceValidationReport,
  DatabaseSourceValidationRequest,
  DatabaseSourceValidationResult,
  DatabaseSourceFileSelection,
  DatabaseSourcePreparationResult,
  FilterSuggestionRequest,
  LeagueEditionKey,
  LeagueSearchRequest,
  PlayerEditionKey,
  RefereeEditionKey,
  RefereeSearchRequest,
  SearchRequest,
  StadiumEditionKey,
  StadiumSearchRequest,
  TeamEditionKey,
  TeamSearchRequest,
  T3dbDatabaseSourcePreparationRequest,
} from '../../src/app/core/qdb-contracts';
import { DatabaseLibrary } from '../database-library';
import { DatabaseRegistry } from '../database-registry';
import {
  DatabaseSourceSelections,
  type SelectedDatabaseSource,
  type SelectedT3dbFileKind,
} from '../database-source-selections';
import { inspectSourceHeaders, SUPPORTED_FIFA_VERSIONS } from '../importer';
import { inspectT3dbSource, t3dbSourceErrorMessage } from '../t3db-source';

let databaseLibrary: DatabaseLibrary;
let databaseRegistry: DatabaseRegistry;

const sourceSelections = new DatabaseSourceSelections();
const imports = new Map<string, { worker: Worker; cancel: () => void }>();
const validations = new Map<string, { worker: Worker; cancel: () => void }>();

app.disableHardwareAcceleration();
app.setName('QDB Finder');

const senderWindow = (event: IpcMainInvokeEvent): BrowserWindow | undefined =>
  BrowserWindow.fromWebContents(event.sender) ?? undefined;

const selectT3dbFile = async (
  event: IpcMainInvokeEvent,
  kind: SelectedT3dbFileKind,
): Promise<DatabaseSourceFileSelection | undefined> => {
  const window = senderWindow(event);
  const options: OpenDialogOptions = {
    properties: ['openFile'],
    filters:
      kind === 'database'
        ? [{ name: 'FIFA t3db database', extensions: ['db'] }]
        : [{ name: 'FIFA metadata XML', extensions: ['xml'] }],
  };
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options);
  if (result.canceled || !result.filePaths[0]) return undefined;
  const path = result.filePaths[0];
  const id = sourceSelections.addT3dbFile(kind, path);
  return { id, displayPath: path, fileName: basename(path) };
};

const databasePath = (): string =>
  process.env['QDB_DATABASE_PATH'] ??
  (app.isPackaged
    ? join(process.resourcesPath, 'database', 'qdb.sqlite')
    : join(app.getAppPath(), 'resources', 'database', 'qdb.sqlite'));

const validateImportRequest = (request: DatabaseImportRequest): string => {
  const name = request.name.trim();
  if (name.length < 1 || name.length > 80)
    throw new Error('Database name must contain between 1 and 80 characters.');
  if (!SUPPORTED_FIFA_VERSIONS.includes(request.version))
    throw new Error('Unsupported FIFA version. Choose FIFA 11–23.');
  if (!/^[0-9a-f-]{36}$/i.test(request.requestId))
    throw new Error('Invalid import request identifier.');
  databaseLibrary.ensureUniqueName(name);
  return name;
};

const validateSourceRequest = (
  request: DatabaseSourceValidationRequest,
): SelectedDatabaseSource => {
  if (!SUPPORTED_FIFA_VERSIONS.includes(request.version))
    throw new Error('Unsupported FIFA version. Choose FIFA 11–23.');
  if (!/^[0-9a-f-]{36}$/i.test(request.requestId))
    throw new Error('Invalid validation request identifier.');
  const source = sourceSelections.get(request.selectionId);
  if (!source) throw new Error('Select the database source again before validating.');
  if (validations.has(request.requestId)) throw new Error('This validation is already running.');
  if (validations.size || imports.size)
    throw new Error('Another database task is already running.');
  return source;
};

const validateDatabaseSource = (
  event: IpcMainInvokeEvent,
  request: DatabaseSourceValidationRequest,
): Promise<DatabaseSourceValidationResult> => {
  const source = validateSourceRequest(request);
  const worker = new Worker(join(__dirname, '..', 'database-source-validation-worker.js'), {
    workerData: { source, version: request.version },
  });
  return new Promise((resolve, reject) => {
    let settled = false;
    let cancelled = false;
    const finish = (): void => {
      validations.delete(request.requestId);
    };
    const cancel = (): void => {
      if (settled) return;
      cancelled = true;
      void worker.terminate();
    };
    validations.set(request.requestId, { worker, cancel });
    worker.on(
      'message',
      (message: {
        type?: unknown;
        message?: unknown;
        report?: DatabaseSourceValidationReport;
        diagnostics?: unknown;
      }) => {
        if (settled) return;
        if (message.type === 'progress' && typeof message.message === 'string') {
          event.sender.send('qdb:databases:validation-progress', {
            requestId: request.requestId,
            message: message.message,
          });
          return;
        }
        if (message.type === 'completed' && message.report) {
          settled = true;
          finish();
          resolve({ status: 'completed', report: message.report });
          return;
        }
        if (message.type === 'failed') {
          settled = true;
          finish();
          if (Array.isArray(message.diagnostics))
            console.error('[qdb:validate] Source validation failed:', ...message.diagnostics);
          resolve({
            status: 'failed',
            message:
              typeof message.message === 'string'
                ? message.message
                : 'The database source could not be validated.',
          });
        }
      },
    );
    worker.on('error', (error) => {
      if (settled) return;
      settled = true;
      finish();
      reject(error);
    });
    worker.on('exit', (code) => {
      if (settled) return;
      settled = true;
      finish();
      if (cancelled) resolve({ status: 'cancelled' });
      else reject(new Error(`Source validation worker exited with code ${code}.`));
    });
  });
};

const importDatabase = (
  event: IpcMainInvokeEvent,
  request: DatabaseImportRequest,
): Promise<DatabaseImportResult> => {
  const name = validateImportRequest(request);
  const source = sourceSelections.get(request.selectionId);
  if (!source) throw new Error('Select the database source again before importing.');
  if (imports.has(request.requestId)) throw new Error('This import is already running.');
  if (imports.size || validations.size)
    throw new Error('Another database task is already running.');
  const databaseId = randomUUID();
  const outputPath = databaseLibrary.temporaryPath(databaseId);
  databaseLibrary.discardTemporary(databaseId);
  const worker = new Worker(join(__dirname, '..', 'database-import-worker.js'), {
    workerData: {
      databaseId,
      databaseName: name,
      outputPath,
      source,
      version: request.version,
    },
  });
  return new Promise((resolve, reject) => {
    let settled = false;
    let cancelled = false;
    const finish = (): void => {
      imports.delete(request.requestId);
      databaseLibrary.discardTemporary(databaseId);
    };
    const cancel = (): void => {
      if (settled) return;
      cancelled = true;
      void worker.terminate();
    };
    imports.set(request.requestId, { worker, cancel });
    worker.on(
      'message',
      (message: {
        type?: unknown;
        message?: unknown;
        error?: DatabaseImportError;
        diagnostics?: unknown;
      }) => {
        if (settled) return;
        if (message.type === 'progress' && typeof message.message === 'string') {
          event.sender.send('qdb:databases:import-progress', {
            requestId: request.requestId,
            message: message.message,
          });
          return;
        }
        if (message.type === 'failed') {
          settled = true;
          finish();
          if (Array.isArray(message.diagnostics))
            console.error('[qdb:import] Source validation failed:', ...message.diagnostics);
          resolve({
            status: 'failed',
            error: message.error ?? {
              code: 'import-failed',
              message: 'Database import failed. Check the selected source and try again.',
              files: [],
            },
          });
          return;
        }
        if (message.type === 'completed') {
          try {
            databaseLibrary.ensureUniqueName(name);
            databaseLibrary.install(databaseId);
            databaseRegistry.refresh();
            const descriptor = databaseLibrary.list().find(({ id }) => id === databaseId);
            if (!descriptor) throw new Error('Imported database could not be registered.');
            settled = true;
            finish();
            sourceSelections.consume(request.selectionId);
            resolve({ status: 'completed', database: descriptor });
          } catch (error) {
            settled = true;
            finish();
            reject(error);
          }
        }
      },
    );
    worker.on('error', (error) => {
      if (settled) return;
      settled = true;
      finish();
      reject(error);
    });
    worker.on('exit', (code) => {
      if (settled) return;
      settled = true;
      finish();
      if (cancelled) resolve({ status: 'cancelled' });
      else reject(new Error(`Database import worker exited with code ${code}.`));
    });
  });
};

const createWindow = async (): Promise<void> => {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f7f8fc',
    icon: join(app.getAppPath(), 'resources', 'icons', 'qdb-finder.png'),
    webPreferences: {
      preload: join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  if (!app.isPackaged) await window.loadURL('http://localhost:4200');
  else
    await window.loadFile(
      join(__dirname, '..', '..', '..', 'dist', 'electron', 'browser', 'index.html'),
    );
  window.show();
};

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  databaseLibrary = new DatabaseLibrary(databasePath(), app.getPath('userData'));
  databaseRegistry = new DatabaseRegistry(databaseLibrary);
  ipcMain.handle('qdb:search', (_event, request: SearchRequest) =>
    databaseRegistry.searchPlayers(request),
  );
  ipcMain.handle('qdb:player', (_event, key: PlayerEditionKey) => databaseRegistry.getPlayer(key));
  ipcMain.handle('qdb:teams:search', (_event, request: TeamSearchRequest) =>
    databaseRegistry.searchTeams(request),
  );
  ipcMain.handle('qdb:team', (_event, key: TeamEditionKey) => databaseRegistry.getTeam(key));
  ipcMain.handle('qdb:leagues:search', (_event, request: LeagueSearchRequest) =>
    databaseRegistry.searchLeagues(request),
  );
  ipcMain.handle('qdb:league', (_event, key: LeagueEditionKey) => databaseRegistry.getLeague(key));
  ipcMain.handle('qdb:referees:search', (_event, request: RefereeSearchRequest) =>
    databaseRegistry.searchReferees(request),
  );
  ipcMain.handle('qdb:referee', (_event, key: RefereeEditionKey) =>
    databaseRegistry.getReferee(key),
  );
  ipcMain.handle('qdb:stadiums:search', (_event, request: StadiumSearchRequest) =>
    databaseRegistry.searchStadiums(request),
  );
  ipcMain.handle('qdb:stadium', (_event, key: StadiumEditionKey) =>
    databaseRegistry.getStadium(key),
  );
  ipcMain.handle('qdb:entity-facets', (_event, request: EntityFacetRequest) =>
    databaseRegistry.suggestEntityFacets(request),
  );
  ipcMain.handle('qdb:suggest', (_event, request: FilterSuggestionRequest) =>
    databaseRegistry.suggest(request),
  );
  ipcMain.handle('qdb:databases:list', () => databaseLibrary.list());
  ipcMain.handle('qdb:databases:select-text-source', async (event) => {
    const window = senderWindow(event);
    const result = window
      ? await dialog.showOpenDialog(window, { properties: ['openDirectory'] })
      : await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled || !result.filePaths[0]) return undefined;
    const path = result.filePaths[0];
    const inspection = inspectSourceHeaders(path);
    const id = sourceSelections.addTextSource(path);
    return {
      id,
      kind: 'text-folder',
      displayPath: path,
      suggestedName: basename(path),
      detection: inspection.detection,
      detectedVersion: inspection.detectedVersion,
    };
  });
  ipcMain.handle('qdb:databases:select-t3db-database', (event) =>
    selectT3dbFile(event, 'database'),
  );
  ipcMain.handle('qdb:databases:select-t3db-metadata', (event) =>
    selectT3dbFile(event, 'metadata'),
  );
  ipcMain.handle(
    'qdb:databases:prepare-t3db-source',
    async (
      _event,
      request: T3dbDatabaseSourcePreparationRequest,
    ): Promise<DatabaseSourcePreparationResult> => {
      const source = sourceSelections.resolveT3dbPair(
        request.databaseFileId,
        request.metadataFileId,
      );
      if (!source)
        return {
          status: 'failed',
          message: 'Select both t3db source files again before continuing.',
        };
      try {
        const inspection = await inspectT3dbSource(source.databasePath, source.metadataPath);
        const id = sourceSelections.addT3dbSource(
          source,
          request.databaseFileId,
          request.metadataFileId,
        );
        return {
          status: 'completed',
          source: {
            id,
            kind: 't3db',
            databaseDisplayPath: source.databasePath,
            metadataDisplayPath: source.metadataPath,
            suggestedName: basename(source.databasePath, extname(source.databasePath)),
            detection: inspection.detection,
            detectedVersion: inspection.detectedVersion,
          },
        };
      } catch (error) {
        console.error('[qdb:t3db] Source inspection failed:', error);
        return { status: 'failed', message: t3dbSourceErrorMessage(error) };
      }
    },
  );
  ipcMain.handle(
    'qdb:databases:validate-source',
    async (event, request: DatabaseSourceValidationRequest) => {
      try {
        return await validateDatabaseSource(event, request);
      } catch (error) {
        console.error('[qdb:validate] Validation request failed:', error);
        const technicalMessage = error instanceof Error ? error.message : String(error);
        const message = /^(Select the|This validation|Another database task|Unsupported FIFA)/.test(
          technicalMessage,
        )
          ? technicalMessage
          : 'The database source could not be validated. Check the source and try again.';
        return { status: 'failed', message } satisfies DatabaseSourceValidationResult;
      }
    },
  );
  ipcMain.handle('qdb:databases:cancel-validation', (_event, requestId: string) => {
    const running = validations.get(requestId);
    if (!running) return false;
    running.cancel();
    return true;
  });
  ipcMain.handle('qdb:databases:import', async (event, request: DatabaseImportRequest) => {
    try {
      return await importDatabase(event, request);
    } catch (error) {
      const technicalMessage = error instanceof Error ? error.message : String(error);
      const message =
        /^(Database name|A database|Select the|This import|Another database task|Unsupported FIFA)/.test(
          technicalMessage,
        )
          ? technicalMessage
          : 'Database import failed. Check the selected source and try again.';
      console.error('[qdb:import] Import request failed:', error);
      return {
        status: 'failed',
        error: {
          code: 'import-failed',
          message,
          files: [],
        },
      } satisfies DatabaseImportResult;
    }
  });
  ipcMain.handle('qdb:databases:cancel-import', (_event, requestId: string) => {
    const running = imports.get(requestId);
    if (!running) return false;
    running.cancel();
    return true;
  });
  ipcMain.handle('qdb:databases:remove', (_event, id: string) => {
    databaseRegistry.closeDatabase(id);
    databaseLibrary.remove(id);
    databaseRegistry.refresh();
  });
  ipcMain.handle('qdb:databases:remove-custom', () => {
    if (imports.size || validations.size)
      throw new Error('Another database task is running. Wait for it to finish and try again.');
    const ids = databaseLibrary.customDatabaseIds();
    for (const id of ids) databaseRegistry.closeDatabase(id);
    try {
      return databaseLibrary.removeCustomDatabases();
    } finally {
      databaseRegistry.refresh();
    }
  });
  if (app.isPackaged) updateElectronApp();
  await createWindow();
  app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) void createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('will-quit', () => {
  for (const running of validations.values()) running.cancel();
  for (const running of imports.values()) running.cancel();
  sourceSelections.clear();
  databaseRegistry?.close();
});
