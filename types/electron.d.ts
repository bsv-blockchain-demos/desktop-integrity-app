import type { FileContent, FileStats } from './index';

interface WriteLogResult {
  success: boolean;
  path?: string;
  error?: string;
}

interface ElectronAPI {
  openDialog: () => Promise<string>;
  readFile: (filePath: string) => Promise<FileContent>;
  onAppQuit: (callback: () => void) => void;
  confirmQuit: () => void;
  writeLog: (fileName: string, data: string) => Promise<WriteLogResult>;
  listLogs: () => Promise<string[]>;
  getFileStats: (filePath: string) => Promise<FileStats | null>;
  saveDecryptedFile: (content: Uint8Array, fileName: string) => Promise<void>;
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
