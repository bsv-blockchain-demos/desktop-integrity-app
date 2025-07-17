const { contextBridge, ipcRenderer } = require('electron');

console.log('[PRELOAD] running');

// Example of exposing IPC safely
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer,
});

contextBridge.exposeInMainWorld('electronAPI', {
  openDialog: () => ipcRenderer.invoke('dialog:open'),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  onAppQuit: (callback) => ipcRenderer.on('app-quit', callback),
  confirmQuit: () => ipcRenderer.send('confirm-quit'),
  writeLog: (fileName, data) => ipcRenderer.invoke('log:write', fileName, data),
  listLogs: () => ipcRenderer.invoke('logs:list'),
  getFileStats: (filePath) => ipcRenderer.invoke('file:stats', filePath),
  saveDecryptedFile: (content, fileName) => ipcRenderer.invoke('save-decrypted-file', content, fileName),
});