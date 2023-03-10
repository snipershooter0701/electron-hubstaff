const { app, BrowserWindow, ipcMain, dialog } = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

const { IPC_CHANNELS } = require('./enums');
const { startCapture, mouseEvent, keyEvent } = require('./components/ScreenShot');
const { uploadToS3 } = require('./components/UploadAws3');
const { loginAPI, settingAPI } = require('./components/api');

const path = require('path');
const ioHook = require('iohook');
let canDeleteStateDefault, screenIntervalDefault, idleTImeDefault;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 330,
    height: 680,
    icon: path.join(__dirname, 'assets/icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#ffff',
    fullscreenable: true,
    titleBarStyle: 'customButtonsOnHover',
    transparent: true,
    frame: true,
    roundedCorners: false,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // to get default setting data
  // settingAPI({}, function (err, res) { // to get default setting data
  //   if (res.statusCode == '200') {
  //     var constData = res.data;
  //     constData.forEach(value => {
  //       if (value.type == "employee_can_delete_time")
  //         canDeleteStateDefault = value.description;
  //       if (value.type == "idle_time")
  //         idleTImeDefault = value.description;
  //       if (value.type == "screenshot_interval")
  //         screenIntervalDefault = value.description;
  //     });
  //     console.log(res.message);
  //   } else {
  //     const options = {
  //       type: 'info',
  //       message: res.message
  //     };
  //     dialog.showMessageBox(null, options);
  //   }
  // });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

var employeeData = null;

// login
ipcMain.on(IPC_CHANNELS.SIGNIN, (event, useremail, password) => {

  if (useremail && password) {
    loginAPI(useremail, password, function (err, res) { // to get Employee Data
      console.log(res);
      if (res.statusCode == '200') {
        employeeData = res.data;
        employeeData.idleTimeLimit = employeeData.idleTimeLimit * 60;
        event.sender.send(IPC_CHANNELS.MAIN_START, res.data);
        console.log(res.message);
      } else {
        const options = {
          type: 'info',
          message: res.message
        };
        dialog.showMessageBox(null, options);
      }
    });
  }
  else {
    const options = {
      type: 'info',
      message: 'useremail or password is required!'
    };
    dialog.showMessageBox(null, options);
  }
});

// start capture
ipcMain.on(IPC_CHANNELS.SCREENSHOT, (e,
  {
  } = {}) => {
  startCapture(e, employeeData, uploadToS3);
});

ioHook.on('mousemove', (event) => {
  mouseEvent();
});

ioHook.on('keydown', (event) => {
  keyEvent();
});

// Register and start hook
ioHook.start();

// Alternatively, pass true to start in DEBUG mode.
ioHook.start(true);

  // False to disable DEBUG. Cleaner terminal output.
  // ioHook.start(false);