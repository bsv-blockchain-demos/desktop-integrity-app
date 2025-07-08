import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log("__dirname", __dirname);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL('http://localhost:5173'); // Load the Vite React app
}

ipcMain.handle('dialog:open', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
  });
  return result.filePaths[0];
});

// Read file (image or text)
ipcMain.handle('file:read', async (event, filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const buffer = fs.readFileSync(filePath);

    const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
    if (isImage) {
      const mime = ext === '.jpg' ? 'jpeg' : ext.replace('.', '');
      const base64 = buffer.toString('base64');
      return { type: 'image', content: `data:image/${mime};base64,${base64}` };
    } else {
      const text = buffer.toString('utf8');
      return { type: 'text', content: text };
    }
  } catch (err) {
    console.error('Failed to read file:', err);
    throw err;
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});