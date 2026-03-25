import { contextBridge, ipcRenderer } from 'electron';

console.log('[PRELOAD] running');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer,
});

contextBridge.exposeInMainWorld('electronAPI', {
  openDialog: (): Promise<string> => ipcRenderer.invoke('dialog:open'),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  onAppQuit: (callback: () => void) => ipcRenderer.on('app-quit', callback),
  confirmQuit: (): void => ipcRenderer.send('confirm-quit'),
  writeLog: (fileName: string, data: string) => ipcRenderer.invoke('log:write', fileName, data),
  listLogs: (): Promise<string[]> => ipcRenderer.invoke('logs:list'),
  getFileStats: (filePath: string) => ipcRenderer.invoke('file:stats', filePath),
  saveDecryptedFile: (content: Uint8Array, fileName: string) => ipcRenderer.invoke('save-decrypted-file', content, fileName),
  minimize: (): void => ipcRenderer.send('window:minimize'),
  toggleMaximize: (): void => ipcRenderer.send('window:toggleMaximize'),
  close: (): void => ipcRenderer.send('window:close'),
});
