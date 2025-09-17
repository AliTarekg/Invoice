const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let serverProcess;
let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // Don't show until ready
  });

  // Open DevTools for debugging
  // mainWindow.webContents.openDevTools();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  mainWindow.loadURL('http://localhost:3005').catch(err => {
    console.error('Failed to load URL:', err);
    // Fallback: try to load local file
    mainWindow.loadFile(path.join(__dirname, 'out', 'index.html'));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Start static server only once
  if (!serverProcess) {
    console.log('Starting server...');
    serverProcess = fork(path.join(__dirname, 'server.js'));
    
    serverProcess.on('message', (msg) => {
      if (msg === 'server-ready') {
        createWindow();
      }
    });

    // Fallback: create window after timeout
    setTimeout(() => {
      if (!mainWindow) {
        createWindow();
      }
    }, 3000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
