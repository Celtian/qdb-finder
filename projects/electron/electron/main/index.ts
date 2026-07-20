import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  shell,
  type IpcMainInvokeEvent,
} from 'electron';
import { randomUUID } from 'node:crypto';
import { basename, join } from 'node:path';
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
} from '../../src/app/core/qdb-contracts';
import { PlayerDatabase } from '../database';
import { DatabaseLibrary } from '../database-library';
import { inspectSourceHeaders, SUPPORTED_FIFA_VERSIONS } from '../importer';

let database: PlayerDatabase;
let databaseLibrary: DatabaseLibrary;
const sourceSelections = new Map<string, string>();
const imports = new Map<string, { worker: Worker; cancel: () => void }>();
const validations = new Map<string, { worker: Worker; cancel: () => void }>();

const useWslWindowControls =
  process.platform === 'linux' &&
  Boolean(process.env['WSL_DISTRO_NAME'] || process.env['WSL_INTEROP']);

app.disableHardwareAcceleration();

const sendMaximizedState = (window: BrowserWindow): void =>
  window.webContents.send('qdb:window:maximized-change', window.isMaximized());

const toggleWindowMaximized = (window: BrowserWindow): void => {
  if (window.isMaximized()) window.unmaximize();
  else window.maximize();
};

const senderWindow = (event: IpcMainInvokeEvent): BrowserWindow | undefined =>
  BrowserWindow.fromWebContents(event.sender) ?? undefined;

const databasePath = (): string =>
  process.env['QDB_DATABASE_PATH'] ??
  (app.isPackaged
    ? join(process.resourcesPath, 'database', 'qdb.sqlite')
    : join(app.getAppPath(), 'resources', 'database', 'qdb.sqlite'));

const switchDatabase = (id: string): ReturnType<DatabaseLibrary['activeInfo']> => {
  const next = new PlayerDatabase(databaseLibrary.pathFor(id));
  try {
    const info = databaseLibrary.activate(id);
    database.close();
    database = next;
    return info;
  } catch (error) {
    next.close();
    throw error;
  }
};

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

const validateSourceRequest = (request: DatabaseSourceValidationRequest): string => {
  if (!SUPPORTED_FIFA_VERSIONS.includes(request.version))
    throw new Error('Unsupported FIFA version. Choose FIFA 11–23.');
  if (!/^[0-9a-f-]{36}$/i.test(request.requestId))
    throw new Error('Invalid validation request identifier.');
  const sourcePath = sourceSelections.get(request.selectionId);
  if (!sourcePath) throw new Error('Select the source folder again before validating.');
  if (validations.has(request.requestId)) throw new Error('This validation is already running.');
  if (validations.size || imports.size)
    throw new Error('Another database task is already running.');
  return sourcePath;
};

const validateDatabaseSource = (
  event: IpcMainInvokeEvent,
  request: DatabaseSourceValidationRequest,
): Promise<DatabaseSourceValidationResult> => {
  const sourcePath = validateSourceRequest(request);
  const worker = new Worker(join(__dirname, '..', 'database-source-validation-worker.js'), {
    workerData: { sourcePath, version: request.version },
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
                : 'The source folder could not be validated.',
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
  const sourcePath = sourceSelections.get(request.selectionId);
  if (!sourcePath) throw new Error('Select the source folder again before importing.');
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
      sourcePath,
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
              message: 'Database import failed. Check the selected folder and try again.',
              files: [],
            },
          });
          return;
        }
        if (message.type === 'completed') {
          try {
            databaseLibrary.ensureUniqueName(name);
            databaseLibrary.install(databaseId);
            switchDatabase(databaseId);
            const descriptor = databaseLibrary.list().find(({ id }) => id === databaseId);
            if (!descriptor) throw new Error('Imported database could not be registered.');
            settled = true;
            finish();
            sourceSelections.delete(request.selectionId);
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
    ...(useWslWindowControls
      ? {
          titleBarStyle: 'hidden' as const,
          titleBarOverlay: {
            color: '#ffffff',
            symbolColor: '#1a1b20',
            height: 44,
          },
        }
      : { frame: false }),
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
  window.on('maximize', () => sendMaximizedState(window));
  window.on('unmaximize', () => sendMaximizedState(window));
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
  database = new PlayerDatabase(databaseLibrary.activePath());
  ipcMain.handle('qdb:search', (_event, request: SearchRequest) => database.search(request));
  ipcMain.handle('qdb:player', (_event, key: PlayerEditionKey) => database.getPlayer(key));
  ipcMain.handle('qdb:teams:search', (_event, request: TeamSearchRequest) =>
    database.searchTeams(request),
  );
  ipcMain.handle('qdb:team', (_event, key: TeamEditionKey) => database.getTeam(key));
  ipcMain.handle('qdb:leagues:search', (_event, request: LeagueSearchRequest) =>
    database.searchLeagues(request),
  );
  ipcMain.handle('qdb:league', (_event, key: LeagueEditionKey) => database.getLeague(key));
  ipcMain.handle('qdb:referees:search', (_event, request: RefereeSearchRequest) =>
    database.searchReferees(request),
  );
  ipcMain.handle('qdb:referee', (_event, key: RefereeEditionKey) => database.getReferee(key));
  ipcMain.handle('qdb:stadiums:search', (_event, request: StadiumSearchRequest) =>
    database.searchStadiums(request),
  );
  ipcMain.handle('qdb:stadium', (_event, key: StadiumEditionKey) => database.getStadium(key));
  ipcMain.handle('qdb:entity-facets', (_event, request: EntityFacetRequest) =>
    database.suggestEntityFacets(request),
  );
  ipcMain.handle('qdb:suggest', (_event, request: FilterSuggestionRequest) =>
    database.suggest(request),
  );
  ipcMain.handle('qdb:info', () => database.info());
  ipcMain.handle('qdb:databases:list', () => databaseLibrary.list());
  ipcMain.handle('qdb:databases:select-source', async (event) => {
    const window = senderWindow(event);
    const result = window
      ? await dialog.showOpenDialog(window, { properties: ['openDirectory'] })
      : await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled || !result.filePaths[0]) return undefined;
    const id = randomUUID();
    sourceSelections.set(id, result.filePaths[0]);
    const inspection = inspectSourceHeaders(result.filePaths[0]);
    return {
      id,
      displayPath: result.filePaths[0],
      folderName: basename(result.filePaths[0]),
      detection: inspection.detection,
      detectedVersion: inspection.detectedVersion,
    };
  });
  ipcMain.handle(
    'qdb:databases:validate-source',
    async (event, request: DatabaseSourceValidationRequest) => {
      try {
        return await validateDatabaseSource(event, request);
      } catch (error) {
        console.error('[qdb:validate] Validation request failed:', error);
        const technicalMessage = error instanceof Error ? error.message : String(error);
        const message =
          /^(Select the source|This validation|Another database task|Unsupported FIFA)/.test(
            technicalMessage,
          )
            ? technicalMessage
            : 'The source folder could not be validated. Check the folder and try again.';
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
        /^(Database name|A database|Select the source|This import|Another database task|Unsupported FIFA)/.test(
          technicalMessage,
        )
          ? technicalMessage
          : 'Database import failed. Check the selected folder and try again.';
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
  ipcMain.handle('qdb:databases:activate', (_event, id: string) => switchDatabase(id));
  ipcMain.handle('qdb:databases:remove', (_event, id: string) => {
    if (database.info().id === id) {
      const builtIn = new PlayerDatabase(databaseLibrary.pathFor('built-in'));
      database.close();
      database = builtIn;
    }
    databaseLibrary.remove(id);
    return database.info();
  });
  ipcMain.handle('qdb:window:minimize', (event) => senderWindow(event)?.minimize());
  ipcMain.handle('qdb:window:toggle-maximize', (event) => {
    const window = senderWindow(event);
    if (!window) return;
    toggleWindowMaximized(window);
  });
  ipcMain.handle('qdb:window:close', (event) => senderWindow(event)?.close());
  ipcMain.handle('qdb:window:is-maximized', (event) => {
    const window = senderWindow(event);
    return window?.isMaximized() ?? false;
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
  database?.close();
});
