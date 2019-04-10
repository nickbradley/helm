import {app, BrowserWindow, globalShortcut, Tray, screen} from "electron";
import * as path from "path";
import { format as formatUrl } from "url";
import * as os from "os";
import { Server } from "./Server";
import { Application } from "../common/entities/Application";
import { Platform } from "../common/Platform";
import { DB } from "../common/DB";
import { spawn } from "child_process";
import Log from "../common/Log";

declare const __static: string;
const isDevelopment = process.env.NODE_ENV !== "production";
// https://github.com/electron-userland/electron-webpack/issues/52#issuecomment-362316068
// const staticPath = isDevelopment ? "./src/static"  : __dirname.replace(/app\.asar$/, "static");
const staticPath = isDevelopment ? __static  : __dirname.replace(/app\.asar$/, "static");

let tray: Tray;
let mainWindow: BrowserWindow;

(async () => {
  const dbPath = path.join(app.getPath("appData"), "helm/helm.db");
  console.log("Connecting to database at ", dbPath);
  await DB.connect(dbPath);

  const applications = Platform.listApplications();
  const savePromises = [];
  for (const app of applications) {
    const application = new Application();
    application.name = app.name;
    application.icon = app.icon;
    application.path = app.path;
    savePromises.push(application.save());
  }
  await Promise.all(savePromises);

  const server = new Server("HelmWatcher");
  await server.start(5600);

  const awPath = process.env.AW_PATH;
  if (!awPath) {
    Log.error("Invalid path to ActivityWatch distribution. Make AW_PATH is set.");
    return process.exit(1);
  }
  console.log("AW_PATH=", awPath);
  const windowWatcher = spawn(path.join(awPath, "aw-watcher-window"));
  // ps.stderr.on("data", (data) => {
  //   console.error(data.toString());
  // });
  // ps.stdout.on("data", (data) => {
  //   console.log(data.toString());
  // });
  windowWatcher.on("error", (code) => {
    console.error("aw-watcher-window failed unexpectedly with code ", code);
  });

  const afkWatcher = spawn(path.join(awPath, "aw-watcher-afk"));
  afkWatcher.on("error", (code) => {
    console.error("aw-watcher-afk failed unexpectedly with code ", code);
  });

  return true;
})();


switch (os.platform()) {
    case "darwin":
        // from https://github.com/kevinsawicki/tray-example

        // Don't show the app in the doc
        app.dock.hide();
        break;
    case "win32":

        break;
    case "linux":
        break;
}



app.on("ready", async () => {
  createTray();
  // createWindow();
  //
  // toggleWindow();
  // globalShortcut.register("Control+Space", () => {
  //   toggleWindow();
  // });
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

// Quit the app when the window is closed
app.on("window-all-closed", () => {
    app.quit();
});

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
    console.log("Creating window: ", isDevelopment);

    mainWindow = new BrowserWindow({
        width: 600,
        height: 450,
        show: false,
        frame: false,
        fullscreenable: false,
        resizable: false,
        skipTaskbar: true
    });

    //if (isDevelopment) {
        mainWindow.webContents.openDevTools();
    //}

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



    // mainWindow.loadFile(path.join(__dirname, "../index.html"));
    // mainWindow.webContents.openDevTools();

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
