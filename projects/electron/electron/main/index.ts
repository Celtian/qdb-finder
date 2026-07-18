import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  screen,
  shell,
  type IpcMainInvokeEvent,
  type Rectangle,
} from 'electron';
import { join } from 'node:path';
import { updateElectronApp } from 'update-electron-app';
import type {
  FilterSuggestionRequest,
  PlayerEditionKey,
  SearchRequest,
} from '../../src/app/core/qdb-contracts';
import { PlayerDatabase } from '../database';

let database: PlayerDatabase;

const useLinuxWorkAreaMaximize =
  process.platform === 'linux' && Boolean(process.env['WAYLAND_DISPLAY']);
const restoredBounds = new WeakMap<BrowserWindow, Rectangle>();
const workAreaMaximizedWindows = new WeakSet<BrowserWindow>();

if (useLinuxWorkAreaMaximize) app.commandLine.appendSwitch('ozone-platform', 'x11');
app.disableHardwareAcceleration();

const isWindowMaximized = (window: BrowserWindow): boolean =>
  workAreaMaximizedWindows.has(window) || window.isMaximized();

const sendMaximizedState = (window: BrowserWindow): void =>
  window.webContents.send('qdb:window:maximized-change', isWindowMaximized(window));

const toggleWindowMaximized = (window: BrowserWindow): void => {
  if (!useLinuxWorkAreaMaximize) {
    if (window.isMaximized()) window.unmaximize();
    else window.maximize();
    return;
  }

  if (workAreaMaximizedWindows.has(window)) {
    const bounds = restoredBounds.get(window);
    workAreaMaximizedWindows.delete(window);
    if (bounds) window.setBounds(bounds);
  } else {
    const bounds = window.getBounds();
    restoredBounds.set(window, bounds);
    workAreaMaximizedWindows.add(window);
    window.setBounds(screen.getDisplayMatching(bounds).workArea);
  }
  sendMaximizedState(window);
};

const senderWindow = (event: IpcMainInvokeEvent): BrowserWindow | undefined =>
  BrowserWindow.fromWebContents(event.sender) ?? undefined;

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
    frame: false,
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
  database = new PlayerDatabase(databasePath());
  ipcMain.handle('qdb:search', (_event, request: SearchRequest) => database.search(request));
  ipcMain.handle('qdb:player', (_event, key: PlayerEditionKey) => database.getPlayer(key));
  ipcMain.handle('qdb:suggest', (_event, request: FilterSuggestionRequest) =>
    database.suggest(request),
  );
  ipcMain.handle('qdb:info', () => database.info());
  ipcMain.handle('qdb:window:minimize', (event) => senderWindow(event)?.minimize());
  ipcMain.handle('qdb:window:toggle-maximize', (event) => {
    const window = senderWindow(event);
    if (!window) return;
    toggleWindowMaximized(window);
  });
  ipcMain.handle('qdb:window:close', (event) => senderWindow(event)?.close());
  ipcMain.handle('qdb:window:is-maximized', (event) => {
    const window = senderWindow(event);
    return window ? isWindowMaximized(window) : false;
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
app.on('will-quit', () => database?.close());
