import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { updateElectronApp } from 'update-electron-app';
import type {
  FilterSuggestionRequest,
  PlayerEditionKey,
  SearchRequest,
} from '../../src/app/core/qdb-contracts';
import { PlayerDatabase } from '../database';

let database: PlayerDatabase;

const databasePath = (): string =>
  process.env['QDB_DATABASE_PATH'] ??
  (app.isPackaged
    ? join(process.resourcesPath, 'database', 'qdb.sqlite')
    : join(app.getAppPath(), 'resources', 'database', 'qdb.sqlite'));

const createWindow = async (): Promise<void> => {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 620,
    show: false,
    backgroundColor: '#f7f8fc',
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
  window.once('ready-to-show', () => window.show());
};

app.whenReady().then(async () => {
  database = new PlayerDatabase(databasePath());
  ipcMain.handle('qdb:search', (_event, request: SearchRequest) => database.search(request));
  ipcMain.handle('qdb:player', (_event, key: PlayerEditionKey) => database.getPlayer(key));
  ipcMain.handle('qdb:suggest', (_event, request: FilterSuggestionRequest) =>
    database.suggest(request),
  );
  ipcMain.handle('qdb:info', () => database.info());
  if (app.isPackaged) updateElectronApp();
  await createWindow();
  app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) void createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('will-quit', () => database?.close());
