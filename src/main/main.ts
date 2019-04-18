import {app, BrowserWindow, globalShortcut, Tray, screen} from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { format as formatUrl } from "url";
import { Server } from "./Server";
import { Application } from "../common/entities/Application";
import { Platform } from "../common/Platform";
import { DB } from "../common/DB";
import "reflect-metadata";
import Log from "electron-log";
import { spawn } from "child_process";
import { ObjectLiteral } from "typeorm";

declare const __static: string;
const isDevelopment = process.env.NODE_ENV !== "production";
// https://github.com/electron-userland/electron-webpack/issues/52#issuecomment-362316068
const staticPath = isDevelopment ? __static  : __dirname.replace(/app\.asar$/, "static");


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



app.on("ready", async () => {
  await initialize();

  // createTray();
  createWindow();

  // toggleWindow();
  globalShortcut.register("Control+Space", () => {
    toggleWindow();
  });
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

// Quit the app when the window is closed
app.on("window-all-closed", () => {
    app.quit();
});

// @ts-ignore
const createTray = () => {
  console.log("Creating tray");
    // const assestPath = path.join(staticPath, '/static').replace(/\\/g, '\\\\');
    tray = new Tray(path.join(staticPath, "/sunTemplate.png"));
    tray.on("right-click", toggleWindow);
    tray.on("double-click", toggleWindow);
    tray.on("click", (event: any) => {
        toggleWindow();

        // // Show devtools when command clicked
        if (mainWindow.isVisible() && process.defaultApp && event.metaKey) {
            mainWindow.webContents.openDevTools({mode: "detach"});
        }
    });
};

const getWindowPosition = () => {
    const windowBounds = mainWindow.getBounds();
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // Center window on primary monitor
    const x = Math.round((width/2) - (windowBounds.width / 2));
    const y = Math.round((height / 2) - (windowBounds.height / 2));

    return {x, y};
};

// @ts-ignore
const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow = new BrowserWindow({
        width: 0.66 * width,
        height: 0.66 * height,
        show: true,
        frame: true,
        fullscreenable: true,
        resizable: true,
        skipTaskbar: false
    });

    if (isDevelopment) {
        mainWindow.webContents.openDevTools();
    }

    if (isDevelopment) {
        mainWindow.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
    }
    else {
        mainWindow.loadURL(formatUrl({
            pathname: path.join(__dirname, "index.html"),
            protocol: "file",
            slashes: true
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


const loadHostApplications = async () => {
  const applications = Platform.listApplications();
  const seenApps: string[] = [];
  const savePromises = [];
  for (const app of applications) {
    if (seenApps.indexOf(app.name) >= 0) {
      Log.verbose(`Skipping app ${app.name} because it has already been added.`);
      continue;
    }

    const application = new Application();
    application.name = app.name.toLowerCase();
    application.icon = app.icon;
    application.path = app.path;
    seenApps.push(app.name);
    savePromises.push(application.save());
  }
  return Promise.all(savePromises);
};

const startWatchers = async (dir: string) => {
  const windowWatcher = spawn(path.join(dir, "aw-watcher-window"));
  windowWatcher.on("error", (code: number) => {
    Log.error(`aw-watcher-window failed unexpectedly with code ${code}.`);
  });

  const afkWatcher = spawn(path.join(dir, "aw-watcher-afk"));
  afkWatcher.on("error", (code: number) => {
    Log.error(`aw-watcher-afk failed unexpectedly with code ${code}.`);
  });
};



const initialize = async () => {
  Log.info(`Initializing main process...`);

  let config: ObjectLiteral = {};
  const configFile = path.join(app.getPath("userData"), "helmconfig.json");

  try {
    Log.info(`Reading config file from ${configFile}`);
    config = JSON.parse(fs.readFileSync(configFile, "utf8"));
  } catch (err) {
    Log.error(`<FATAL> Failed to read ${configFile}. Please ensure the file exists and is valid JSON.`);
    app.exit(1);
  }

  try {
    Log.info(`Connecting to database.`);
    await DB.connect();
  } catch (err) {
    Log.error(`<FATAL> Failed to connect to the database: ${err.message}`);
    app.exit(1);
  }

  try {
    Log.info(`Getting information about installed applications.`);
    await loadHostApplications();
  } catch (err) {
    Log.error(`<FATAL> Failed to get information about installed applications: ${err.message}`);
    app.exit(1);
  }

  try {
    Log.info(`Starting ActivityWatch-compatible REST server.`);
    const server = new Server("HelmWatcher");
    await server.start(5600);
  } catch (err) {
    Log.error(`<FATAL> Failed to start ActivityWatch-compatible REST server: ${err.message}`);
    app.exit(1);
  }

  try {
    Log.info(`Starting hosted watchers.`);
    const awPath = config.awPath;
    if (awPath) {
      await startWatchers(awPath);
    } else {
      Log.error(`Missing key 'awPath' in ${configFile}. Cannot start watchers; some features may be unavailable until the key is added to the config.`);
    }
  } catch (err) {
    Log.error(`Failed to start watchers; some features may be unavailable until the error is resolved: ${err.message}`);
  }

  Log.info(`Initialization complete.`);
};
