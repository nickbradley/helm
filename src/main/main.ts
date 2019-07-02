import { app, BrowserWindow, globalShortcut, Menu, Tray, screen, ipcMain } from "electron";
// import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { format as formatUrl } from "url";
// import { Server } from "./Server";
// import { Application } from "../common/entities/Application";
// import { Platform } from "../common/Platform";
// import { DB } from "../common/DB";
import "reflect-metadata";
import Log from "electron-log";
// import { ObjectLiteral } from "typeorm";


declare const __static: string;
const isDevelopment = process.env.NODE_ENV !== "production";
// https://github.com/electron-userland/electron-webpack/issues/52#issuecomment-362316068
const staticPath = isDevelopment ? __static : __dirname.replace(/app\.asar$/, "static");
// Log.info(`<TRACE> staticPath = ${staticPath} and __dirname = ${__dirname}`);

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (isDevelopment) {
  app.setPath("userData", path.join(app.getPath("appData"), "helm-dev"));
}

// Configure logging
Log.transports.file.fileName = `${app.getName()}.log`;


let tray: Tray;
let mainWindow: BrowserWindow;
let backgroundWindow: BrowserWindow;

switch (os.platform()) {
  case "darwin":
    // from https://github.com/kevinsawicki/tray-example

    // Don't show the app in the doc
    // app.dock.hide();
    break;
  case "win32":

    break;
  case "linux":
    break;
}

ipcMain.on("hide", (event: any) => {
  hideWindow();
  event.returnValue = true;
});


app.on("ready", async () => {
  createTray();
  createWindow();

  // toggleWindow();
  globalShortcut.register("Control+Space", () => {
    toggleWindow();
  });
});

// app.on("will-quit", async () => {
//   console.log("App is quitting!!!");
//   // await server.stop();
//   // globalShortcut.unregisterAll();
//   app.quit();
// });
//
// // Quit the app when the window is closed
// app.on("window-all-closed", () => {
//   console.log("App should exit!!!");
//   app.quit();
// });

// @ts-ignore
const createTray = () => {
  console.log("Creating tray");
  // const assestPath = path.join(staticPath, '/static').replace(/\\/g, '\\\\');
  console.log("staticPath", staticPath);
  tray = new Tray(path.join(staticPath, "/helm_16.png"));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show/Hide",
      click() {
        toggleWindow();
      }
    },
    {
      label: "Show DB file",
      click() {
        // shell.showItemInFolder(DB.path);
      }
    },
    {
      type: "separator"
    },
    {
      label: "Dev Tools",
      click() {
        mainWindow.webContents.openDevTools({ mode: "detach" });
        backgroundWindow.webContents.openDevTools({ mode: "detach" });
      }
    },
    {
      type: "separator"
    }, {
      label: "Exit",
      click() {
        app.quit();
      }
    }

  ]);

  tray.setToolTip("This is my application.");
  tray.setContextMenu(contextMenu);

  tray.on("right-click", toggleWindow);
  tray.on("double-click", () => {
    console.log("tray dbl clicked");
    toggleWindow();
  });
  tray.on("click", (event: any) => {
    // console.log("Event is ", event);
    // console.log("event.metakey", event.metaKey);
    toggleWindow();
    // // Show devtools when command clicked
    // if (mainWindow.isVisible()) { // && event.metaKey) {
    //   mainWindow.webContents.openDevTools({ mode: "detach" });
    // }
  });
};

const getWindowPosition = () => {
  const windowBounds = mainWindow.getBounds();
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Center window on primary monitor
  const x = Math.round((width / 2) - (windowBounds.width / 2));
  const y = Math.round((height / 2) - (windowBounds.height / 2));

  return { x, y };
};

// @ts-ignore
const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const devBrowserWindow = {
    width: 0.66 * width,
    height: 0.66 * height,
    show: true,
    frame: true,
    fullscreenable: true,
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      webSecurity: false
    }
  };

  const prodBrowserWindow = {
    width: 0.66 * width,
    height: 0.66 * height,
    show: true,
    frame: false,
    fullscreenable: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      webSecurity: false
    }
  };
  mainWindow = new BrowserWindow(isDevelopment ? devBrowserWindow : prodBrowserWindow);
  backgroundWindow = new BrowserWindow({ show: false });
  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
    backgroundWindow.webContents.openDevTools();
  }
  const bgWindowId = backgroundWindow.webContents.id;

  if (isDevelopment) {
    mainWindow.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}?type=ui&id=${bgWindowId}`);
    backgroundWindow.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}?type=background`);
  } else {
    mainWindow.loadURL(formatUrl({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file",
      slashes: true,
      query: {
        type: "ui",
        id: bgWindowId
      }
    }));

    backgroundWindow.loadURL(formatUrl({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file",
      slashes: true,
      query: {
        type: "background"
      }
    }));
  }

  // Hide the window when it loses focus
  mainWindow.on("blur", () => {
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });
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
