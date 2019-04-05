const electron = require('electron');
const app = electron.app;
const showLockScreen = require('lock-system');

const BrowserWindow = electron.BrowserWindow;

let mainWindow = null;
let countdownWin = null;

let isLocked = false;
app.on('window-all-closed', function() {
  if (process.platform !== 'darwin' && !isLocked) {
    app.quit();
  }
});

const createCountDownWindow = () => {
  let win = new BrowserWindow({fullscreen: true, frame: false, alwaysOnTop: true, transparent: true, focusable: false, setSkipTaskbar: true});
  win.loadURL('file://' + __dirname + '/../renderer/countdown.html?duration=10000');
  win.setIgnoreMouseEvents(true);
  win.setSkipTaskbar(true);
  win.on('closed', function() {
    win = null;
  });
  return win;
};
const createMainWindow = () => {

  let win = new BrowserWindow({show: false, width: 350, height: 300, maximizable: false, focusable: false, setSkipTaskbar: true, webPreferences: { experimentalFeatures: true } });
  win.loadURL('file://' + __dirname + '/../renderer/detector.html');
  win.setMenu(null);
  win.on('closed', function() {
    win = null;
  });
  win.flashFrame(false);
  return win;
};

app.on('ready', function() {

  let currentFaceCount = 0;
  mainWindow = createMainWindow();
  electron.ipcMain.on('asynchronous-message', (event, arg) => {
    if (arg.type === 'faces') {
      const faceCount = parseInt(arg.value);
      if (currentFaceCount === faceCount) return;
      currentFaceCount = faceCount;
      if (countdownWin && !countdownWin.isDestroyed()) countdownWin.close();
      if (currentFaceCount > 0) return;

      // mainWindow.flashFrame(true);
      countdownWin = createCountDownWindow();
    } else if (arg.type === 'lock' && arg.value) {
      if (!isLocked) showLockScreen();
      if (countdownWin && !countdownWin.isDestroyed()) countdownWin.close();
    }
  });
  electron.powerMonitor.on('lock-screen', () => {
    isLocked = true;
    if (countdownWin && !countdownWin.isDestroyed()) countdownWin.close();
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  });
  electron.powerMonitor.on('unlock-screen', () => {
    mainWindow = createMainWindow();
    isLocked = false;
  });

  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
    // app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
    // app.exit(0)
  }, 300000);
});
