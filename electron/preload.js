import { contextBridge, ipcRenderer } from 'electron';

// Example of exposing IPC safely
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer,
});
