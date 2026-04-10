import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import type { FileContent, FileStats } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log("__dirname", __dirname);

const isDev = !app.isPackaged;

let win: BrowserWindow;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 700,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  win.on('close', (e) => {
    e.preventDefault();
    win.webContents.send('app-quit');
  });
}

ipcMain.on('window:minimize', () => { win.minimize(); });

ipcMain.on('window:toggleMaximize', () => {
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});

ipcMain.on('window:close', () => { win.close(); });

ipcMain.handle('dialog:open', async (): Promise<string> => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'] });
  return result.filePaths[0];
});

function getLogsDir(): string {
  const logsDir = isDev
    ? path.join(process.cwd(), 'LOGS')
    : path.join(app.getPath('userData'), 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  return logsDir;
}

ipcMain.handle('log:write', async (_event, fileName: string, logData: string) => {
  try {
    const logsDir = getLogsDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = fileName.replace(/[<>:"/\\|?*]/g, '');
    const logFileName = `${safeName}-${timestamp}.txt`;
    const fullPath = path.join(logsDir, logFileName);

    fs.writeFileSync(fullPath, logData, 'utf8');
    return { success: true, path: fullPath };
  } catch (err) {
    console.error('Failed to write log file:', err);
    return { success: false, error: (err as Error).message };
  }
});

ipcMain.handle('logs:list', async (): Promise<string[]> => {
  const logsDir = getLogsDir();
  try {
    const files = fs.readdirSync(logsDir);
    return files.map(filename => path.join(logsDir, filename));
  } catch (err) {
    console.error('Failed to list log files:', err);
    return [];
  }
});

ipcMain.handle('file:stats', async (_event, filePath: string): Promise<FileStats | null> => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      modifiedTS: stats.mtime.toISOString(),
      createdTS: stats.birthtime.toISOString(),
    };
  } catch (err) {
    console.error('Failed to get file stats:', err);
    return null;
  }
});

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

ipcMain.handle('file:read', async (_event, filePath: string): Promise<FileContent> => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_BYTES) {
      throw new Error(`File exceeds the 25 MB size limit (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
    }
    const buffer = fs.readFileSync(filePath);
    const name = path.basename(filePath);
    const bytes = Array.from(buffer);

    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.ico', '.tiff', '.tif'];
    const textExts = [
      '.txt', '.json', '.csv', '.md', '.html', '.xml', '.yaml', '.yml',
      '.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.less',
      '.py', '.rs', '.go', '.java', '.cpp', '.c', '.h', '.sh',
      '.toml', '.ini', '.cfg', '.log', '.sql',
    ];
    const audioExts = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus', '.wma'];
    const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv', '.m4v'];

    if (imageExts.includes(ext)) {
      const mime = ext === '.jpg' ? 'jpeg'
        : ext === '.svg' ? 'svg+xml'
        : ext.replace('.', '');
      return { type: 'image', content: `data:image/${mime};base64,${buffer.toString('base64')}`, bytes, name };
    }

    if (ext === '.pdf') {
      return { type: 'pdf', content: `data:application/pdf;base64,${buffer.toString('base64')}`, bytes, name };
    }

    if (textExts.includes(ext)) {
      return { type: 'text', content: buffer.toString('utf8'), bytes, name };
    }

    if (audioExts.includes(ext)) {
      const audioMime: Record<string, string> = {
        '.mp3': 'mpeg', '.wav': 'wav', '.ogg': 'ogg', '.flac': 'flac',
        '.aac': 'aac', '.m4a': 'mp4', '.opus': 'opus', '.wma': 'x-ms-wma',
      };
      return { type: 'audio', content: `data:audio/${audioMime[ext] ?? ext.replace('.', '')};base64,${buffer.toString('base64')}`, bytes, name };
    }

    if (videoExts.includes(ext)) {
      const videoMime: Record<string, string> = {
        '.mp4': 'mp4', '.webm': 'webm', '.mov': 'quicktime',
        '.avi': 'x-msvideo', '.mkv': 'x-matroska', '.wmv': 'x-ms-wmv', '.m4v': 'mp4',
      };
      return { type: 'video', content: `data:video/${videoMime[ext] ?? ext.replace('.', '')};base64,${buffer.toString('base64')}`, bytes, name };
    }

    return { type: 'binary', content: '', bytes, name };
  } catch (err) {
    console.error('Failed to read file:', err);
    throw err;
  }
});

ipcMain.handle('save-decrypted-file', async (_event, content: Uint8Array, fileName: string) => {
  const result = await dialog.showSaveDialog({
    title: 'Save Recalled File',
    defaultPath: `recalled_${fileName}`,
  });

  if (result.canceled || !result.filePath) return { success: false };

  try {
    fs.writeFileSync(result.filePath, Buffer.from(content));
    return { success: true };
  } catch (err) {
    console.error('Failed to save file:', err);
    return { success: false, error: (err as Error).message };
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  console.error('Failed to create window:', error);
});

ipcMain.on('confirm-quit', () => {
  win.destroy();
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
