const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  exec: (sql, params) => ipcRenderer.invoke('db-exec', sql, params),
  queryAll: (sql, params) => ipcRenderer.invoke('db-query-all', sql, params),
  queryOne: (sql, params) => ipcRenderer.invoke('db-query-one', sql, params)
});