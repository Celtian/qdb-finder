import { contextBridge, ipcRenderer } from 'electron';
import type { QdbApi } from '../src/app/core/qdb-contracts';

const api: QdbApi = {
  searchPlayers: (request) => ipcRenderer.invoke('qdb:search', request),
  getPlayer: (key) => ipcRenderer.invoke('qdb:player', key),
  suggestFilters: (request) => ipcRenderer.invoke('qdb:suggest', request),
  getDatabaseInfo: () => ipcRenderer.invoke('qdb:info'),
};

contextBridge.exposeInMainWorld('qdb', api);
