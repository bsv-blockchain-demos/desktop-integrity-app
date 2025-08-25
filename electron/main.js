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

  win.loadURL('http://localhost:5173'); // Load the Vite React app

  // Intercept close to allow renderer cleanup
  win.on('close', (e) => {
    e.preventDefault(); // prevent immediate close
    win.webContents.send('app-quit'); // ask renderer to clean up
  });
}

ipcMain.on('window:minimize', () => {
  win.minimize();
});

ipcMain.on('window:toggleMaximize', () => {
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.on('window:close', () => {
  win.close();
});

ipcMain.handle('dialog:open', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
  });
  return result.filePaths[0];
});

ipcMain.handle('log:write', async (event, fileName, logData) => {
  try {
    const logsDir = path.resolve(process.cwd(), 'LOGS');

    // Ensure the LOGS folder exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    // Create a unique log file name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = fileName.replace(/[<>:"/\\|?*]/g, ''); // Remove bad characters
    const logFileName = `${safeName}-${timestamp}.txt`;

    const fullPath = path.join(logsDir, logFileName);

    // Write the log content
    fs.writeFileSync(fullPath, logData, 'utf8');
    return { success: true, path: fullPath };
  } catch (err) {
    console.error('Failed to write log file:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('logs:list', async () => {
  const logsDir = path.resolve(process.cwd(), 'LOGS');
  try {
    const files = fs.readdirSync(logsDir);
    return files.map(filename => path.join(logsDir, filename));
  } catch (err) {
    console.error('Failed to list log files:', err);
    return [];
  }
});

ipcMain.handle('file:stats', async (event, filePath) => {
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

// Save recalled file
ipcMain.handle('save-decrypted-file', async (event, content, fileName) => {
  const result = await dialog.showSaveDialog({
    title: 'Save Recalled File',
    defaultPath: `recalled_${fileName}`,
  });

  if (result.canceled || !result.filePath) return;

  // Ensure content is a Buffer
  const buffer = Buffer.from(content);

  fs.writeFileSync(result.filePath, buffer);
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