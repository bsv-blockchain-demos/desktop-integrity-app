import { contextBridge, ipcRenderer } from 'electron';

// Example of exposing IPC safely
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer,
});

contextBridge.exposeInMainWorld('electronAPI', {
  openDialog: () => ipcRenderer.invoke('dialog:open'),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
});