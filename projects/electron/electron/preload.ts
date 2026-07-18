import { contextBridge, ipcRenderer } from 'electron';
import type { QdbApi, QdbWindowApi } from '../src/app/core/qdb-contracts';

const api: QdbApi = {
  searchPlayers: (request) => ipcRenderer.invoke('qdb:search', request),
  getPlayer: (key) => ipcRenderer.invoke('qdb:player', key),
  suggestFilters: (request) => ipcRenderer.invoke('qdb:suggest', request),
  getDatabaseInfo: () => ipcRenderer.invoke('qdb:info'),
};

const windowApi: QdbWindowApi = {
  minimize: () => ipcRenderer.invoke('qdb:window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('qdb:window:toggle-maximize'),
  close: () => ipcRenderer.invoke('qdb:window:close'),
  isMaximized: () => ipcRenderer.invoke('qdb:window:is-maximized'),
  onMaximizedChange: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, maximized: boolean): void =>
      listener(maximized);
    ipcRenderer.on('qdb:window:maximized-change', handler);
    return () => ipcRenderer.removeListener('qdb:window:maximized-change', handler);
  },
};

contextBridge.exposeInMainWorld('qdb', api);
contextBridge.exposeInMainWorld('qdbWindow', windowApi);
