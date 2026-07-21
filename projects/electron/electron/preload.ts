import { contextBridge, ipcRenderer } from 'electron';
import type { QdbApi, QdbWindowApi } from '../src/app/core/qdb-contracts';

const api: QdbApi = {
  searchPlayers: (request) => ipcRenderer.invoke('qdb:search', request),
  getPlayer: (key) => ipcRenderer.invoke('qdb:player', key),
  searchTeams: (request) => ipcRenderer.invoke('qdb:teams:search', request),
  getTeam: (key) => ipcRenderer.invoke('qdb:team', key),
  searchLeagues: (request) => ipcRenderer.invoke('qdb:leagues:search', request),
  getLeague: (key) => ipcRenderer.invoke('qdb:league', key),
  searchReferees: (request) => ipcRenderer.invoke('qdb:referees:search', request),
  getReferee: (key) => ipcRenderer.invoke('qdb:referee', key),
  searchStadiums: (request) => ipcRenderer.invoke('qdb:stadiums:search', request),
  getStadium: (key) => ipcRenderer.invoke('qdb:stadium', key),
  suggestEntityFacets: (request) => ipcRenderer.invoke('qdb:entity-facets', request),
  suggestFilters: (request) => ipcRenderer.invoke('qdb:suggest', request),
  listDatabases: () => ipcRenderer.invoke('qdb:databases:list'),
  selectDatabaseSource: () => ipcRenderer.invoke('qdb:databases:select-source'),
  validateDatabaseSource: (request) => ipcRenderer.invoke('qdb:databases:validate-source', request),
  cancelDatabaseSourceValidation: (requestId) =>
    ipcRenderer.invoke('qdb:databases:cancel-validation', requestId),
  importDatabase: (request) => ipcRenderer.invoke('qdb:databases:import', request),
  cancelDatabaseImport: (requestId) => ipcRenderer.invoke('qdb:databases:cancel-import', requestId),
  removeDatabase: (id) => ipcRenderer.invoke('qdb:databases:remove', id),
  onDatabaseSourceValidationProgress: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: Parameters<typeof listener>[0]) =>
      listener(progress);
    ipcRenderer.on('qdb:databases:validation-progress', handler);
    return () => ipcRenderer.removeListener('qdb:databases:validation-progress', handler);
  },
  onDatabaseImportProgress: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: Parameters<typeof listener>[0]) =>
      listener(progress);
    ipcRenderer.on('qdb:databases:import-progress', handler);
    return () => ipcRenderer.removeListener('qdb:databases:import-progress', handler);
  },
};

const windowApi: QdbWindowApi = {
  nativeControls:
    process.platform === 'linux' &&
    Boolean(process.env['WSL_DISTRO_NAME'] || process.env['WSL_INTEROP']),
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
