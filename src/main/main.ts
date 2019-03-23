import {app, BrowserWindow, globalShortcut, Tray, screen} from "electron";
import * as path from "path";
import { format as formatUrl } from 'url'
import * as os from "os";

// from https://github.com/kevinsawicki/tray-example

let tray: Tray;
let mainWindow: BrowserWindow;

const isDevelopment = process.env.NODE_ENV !== 'production';

switch (os.platform()) {
    case "darwin":
        // Don't show the app in the doc
        app.dock.hide();
        break;
    case "win32":

        break;
    case "linux":
        break;
}


app.on('ready', () => {
    createTray();
    createWindow();
    globalShortcut.register('Control+Space', () => {
        toggleWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
});

// Quit the app when the window is closed
app.on('window-all-closed', () => {
    app.quit();
});

const createTray = () => {
    tray = new Tray(path.join(__static, '/sunTemplate.png'));
    tray.on('right-click', toggleWindow);
    tray.on('double-click', toggleWindow);
    tray.on('click', (event: any) => {
        toggleWindow();

        // // Show devtools when command clicked
        // if (mainWindow.isVisible() && process.defaultApp && event.metaKey) {
        //     mainWindow.openDevTools({mode: 'detach'})
        // }
    });
};

const getWindowPosition = () => {
    const windowBounds = mainWindow.getBounds();
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // Center window on primary monitor
    const x = Math.round((width/2) - (windowBounds.width / 2));
    const y = Math.round((height / 2) - (windowBounds.height / 2));

    return {x, y}
};

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 450,
        show: false,
        frame: false,
        fullscreenable: false,
        resizable: false,
        skipTaskbar: true,
    });

    if (isDevelopment) {
        mainWindow.webContents.openDevTools()
    }

    if (isDevelopment) {
        mainWindow.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
    }
    else {
        mainWindow.loadURL(formatUrl({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file',
            slashes: true
        }))
    }



    // mainWindow.loadFile(path.join(__dirname, "../index.html"));
    // mainWindow.webContents.openDevTools();

    // Hide the window when it loses focus
    mainWindow.on('blur', () => {
        if (!mainWindow.webContents.isDevToolsOpened()) {
            mainWindow.hide()
        }
    })
};

const toggleWindow = () => {
    if (mainWindow.isVisible()) {
        hideWindow();
    } else {
        showWindow();
    }
};

const showWindow = () => {
    const position = getWindowPosition();
    mainWindow.setPosition(position.x, position.y, false);
    mainWindow.show();
    mainWindow.focus();
    globalShortcut.register("Escape", () => {
        hideWindow();
    });
};

const hideWindow = () => {
    globalShortcut.unregister("Escape");
    mainWindow.hide();
};
