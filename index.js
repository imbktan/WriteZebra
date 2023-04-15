const { app, BrowserWindow, Tray, nativeImage,Menu, globalShortcut,ipcMain,clipboard } = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

let mainWindow;
let tray;
let shouldQuit = false;
let selectedText = "";


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {
            //autoHideMenuBar: true,
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
        frame: false,
        focusable: true,
        //transparent: true, 
        resizable: false,
        icon: __dirname + '/icons/icon.png'
    });
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAlwaysOnTop(true, 'screen');

    mainWindow.loadFile('index.html');
    //mainWindow.hide();
    mainWindow.show();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    globalShortcut.register('Control+Shift+k', async() => {
        if(mainWindow.isVisible()){
            mainWindow.hide() 
        }else{
            if(process.platform === "linux") {
                selectedText = clipboard.readText('selection');
            }else{
                selectedText = await getSelectedText();
            }
            mainWindow.reload();
            await new Promise(r => setTimeout(r, 50));
            mainWindow.show();
        }
    });

    mainWindow.on('close', event=>{
        if(shouldQuit==false){
            event.preventDefault(); 
            mainWindow.hide();
        }
    });

    ipcMain.on('message-from-renderer', async(event, arg) => {
        //console.log(arg);
        let request = JSON.parse(arg);

        if(request.cmd=='resize'){
            mainWindow.resizable = true;
            mainWindow.setContentSize(mainWindow.getSize()[0], request.height);
            mainWindow.resizable = false;
        }else if(request.cmd='getSelectedText'){
            const response = JSON.stringify(
                {
                    cmd: request.cmd,
                    result: selectedText
                }
            );
            event.sender.send('message-from-main', response);
        }   
    });    
      
}

if(process.platform === "linux") {
    app.commandLine.appendSwitch('enable-transparent-visuals');
    app.disableHardwareAcceleration();
}      

app.whenReady().then(() => {
    app.allowRendererProcessReuse = false
    tray = new Tray(__dirname + '/icons/icon.png');
    
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show', click(item, focusedWindow){
                mainWindow.show();
            } 
        },
        { label: 'Quit Application', click(item, focusedWindow){
                shouldQuit = true;
                app.quit();
            }
        },

      ])
      tray.setToolTip('WriteZebra');
    tray.setContextMenu(contextMenu)

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


async function getSelectedTextXSel() {
    const util = require('util');
    const exec = util.promisify(require('child_process').exec);    
    try {
        const { stdout, stderr } = await exec('xsel -o');
        if (stderr) {
            console.error(`Error copying selected text: ${stderr}`);
            return;
        }
        console.log(`Selected text: ${stdout}`);
        return stdout;
    } catch (err) {
        console.error(`Error copying selected text: ${err}`);
    }
    return "";
}

async function getSelectedText(){
    const robot = require('robotjs');
    await new Promise(r => setTimeout(r, 300));
    robot.keyTap('c', process.platform==='darwin' ? 'command' : 'control');
    const selectedText = clipboard.readText("selection");
    return selectedText;
}


