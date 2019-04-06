const showLockScreen = require('lock-system');
const electron = require('electron');
const { app, BrowserWindow, ipcMain, Tray, Menu} = electron;

let mainWindow = null;
let countdownWin = null;
let duration = 10000;
let isLocked = false;

app.on('window-all-closed', function() {
  // if (process.platform !== 'darwin' && !isLocked) {
  //   app.quit();
  // }
});

const createCountDownWindow = () => {
  let win = new BrowserWindow({fullscreen: true, frame: false, alwaysOnTop: true, transparent: true, focusable: false, setSkipTaskbar: true});
  win.loadURL(`file://${__dirname}/../renderer/countdown.html?duration=${duration}`);
  win.setIgnoreMouseEvents(true);
  win.on('closed', ()  => {
    win = null;
  });
  return win;
};
const createMainWindow = () => {
  let win = new BrowserWindow({show: false, width: 350, height: 300, maximizable: false, focusable: false, setSkipTaskbar: true, webPreferences: { experimentalFeatures: true } });
  win.loadURL(`file://${__dirname}/../renderer/detector.html`);
  win.setMenu(null);
  win.on('closed', () => {
    win = null;
  });
  win.flashFrame(false);
  return win;
};

app.on('ready', () => {
  const powerMonitor = electron.powerMonitor;

  let currentFaceCount = 0;
  mainWindow = createMainWindow();
  ipcMain.on('asynchronous-message', (event, arg) => {
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
    } else if (arg.type === 'process' && arg.value === 'exit') {
      app.quit();
    }
  });
  powerMonitor.on('lock-screen', () => {
    isLocked = true;
    if (countdownWin && !countdownWin.isDestroyed()) countdownWin.close();
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
  });
  powerMonitor.on('unlock-screen', () => {
    if (contextMenu.items[0].checked) mainWindow = createMainWindow();
    isLocked = false;
  });

  const tray = new Tray(`${__dirname}/../assets/trayicon.png`);
  const contextMenu = Menu.buildFromTemplate([
    {label: 'Watching', type: 'checkbox', checked: true, click: (item) => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
      if(item.checked) {
        mainWindow = createMainWindow();
      }
    }},
    {label: 'Exit', click: () => app.quit()}
  ]);
  tray.setToolTip('Double click to toggle the watching state.');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (countdownWin && !countdownWin.isDestroyed()) countdownWin.close();
    if (mainWindow && !mainWindow.isDestroyed()) {
      contextMenu.items[0].checked = false;
      mainWindow.close();
    } else {
      contextMenu.items[0].checked = true;
      mainWindow = createMainWindow();
    }
  });

  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
    // app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
    // app.exit(0)
  }, 300000);
});
