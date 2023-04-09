const { app, BrowserWindow, Tray, nativeImage, globalShortcut,ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

let mainWindow;
let tray;
let copiedText ="";
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {
            autoHideMenuBar: true,
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
        frame: true,
        transparent: true,
        icon: __dirname + '/icons/icon.png'
    });
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAlwaysOnTop(true, 'screen');

    mainWindow.loadFile('index.html');
    mainWindow.hide();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    globalShortcut.register('Control+Shift+K', async() => {
        mainWindow.reload();
        await new Promise(r => setTimeout(r, 100));
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();

    });

    mainWindow.on('close', event=>{
        event.preventDefault(); 
        mainWindow.hide();
    });

    ipcMain.on('message-from-renderer', (event, arg) => {
        //console.log(arg);
        let request = JSON.parse(arg);
        if(request.cmd='resize'){
            mainWindow.resizable = true;
            mainWindow.setSize(mainWindow.getSize()[0], request.height+30);
            mainWindow.resizable = false;
        }
    });    
      
}

app.whenReady().then(() => {
    tray = new Tray(__dirname + '/icons/icon.png');
    tray.setToolTip('WriteZebra');
    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});




