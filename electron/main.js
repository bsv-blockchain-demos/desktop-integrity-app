import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log("__dirname", __dirname);

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1800,
    height: 1200,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL('http://localhost:5173'); // Load the Vite React app

  // Intercept close to allow renderer cleanup
  win.on('close', (e) => {
    e.preventDefault(); // prevent immediate close
    win.webContents.send('app-quit'); // ask renderer to clean up
  });
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
    const name = path.basename(filePath);

    const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
    if (isImage) {
      const mime = ext === '.jpg' ? 'jpeg' : ext.replace('.', '');
      const base64 = buffer.toString('base64');
      return { type: 'image', content: `data:image/${mime};base64,${base64}`, name };
    } else {
      const text = buffer.toString('utf8');
      return { type: 'text', content: text, name };
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

ipcMain.on('confirm-quit', () => {
  // Now it's safe to destroy the window and quit
  win.destroy();
  app.quit();
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') app.quit();
});