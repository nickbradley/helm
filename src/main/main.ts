import {app, BrowserWindow, globalShortcut, Tray, screen} from "electron";
import * as path from "path";
import { format as formatUrl } from "url";
import * as os from "os";
import { Server } from "./Server";
// import { createConnection } from "typeorm";
import { Application } from "../common/entities/Application";
// import { Tracker } from "../common/entities/Tracker";
// import { Window } from "../common/entities/Window";
// import { Browser } from "../common/entities/Browser";
import { Platform } from "../common/Platform";
// import { Editor } from "../common/entities/Editor";
// import { Interaction } from "../common/entities/Interaction";
// import { Shell } from "../common/entities/Shell";
import { DB } from "../common/DB";
// import { spawn } from "child_process";
// import { DB } from "../common/DB";
// import { Window } from "../common/entities/Window";
// import { Application } from "../common/entities/Application";
// import { Platform } from "../common/Platform";
// import {fork} from "child_process";

// declare const __static: string;
const isDevelopment = process.env.NODE_ENV !== "production";
// https://github.com/electron-userland/electron-webpack/issues/52#issuecomment-362316068
const staticPath = isDevelopment ? "./src/static"  : __dirname.replace(/app\.asar$/, "static");
// const staticPath = isDevelopment ? __static  : __dirname.replace(/app\.asar$/, "static");

let tray: Tray;
let mainWindow: BrowserWindow;

(async () => {
  await DB.connect();
  const server = new Server("HelmWatcher");

  const applications = Platform.listApplications();

  const savePromises = [];
  for (const app of applications) {
    const application = new Application();
    application.name = app.name;
    application.icon = app.icon;
    application.path = app.path;
    savePromises.push(application.save());
  }
  await Promise.all(savePromises).then(()=>console.log("done")).catch((err)=>console.error("failed!", err));


  await server.start(5600);
  // const ps = spawn("/home/ncbradley/do/activitywatch/dist/activitywatch/aw-watcher-window");
  // ps.stderr.on("data", (data) => {
  //   console.error(data.toString());
  // });
  // ps.stdout.on("data", (data) => {
  //   console.log(data.toString());
  // });
  // ps.on("error", (code) => {
  //   console.error("aw-watcher-window failed unexpectedly with code ", code);
  // });
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

// console.log("Main--Creating fork...");
// fork("./src/main/server/Daemon.js", [], {
//     env: {
//         ELECTRON_VERSION: "3.0.5"
//     }});

app.on("ready", async () => {
  createTray();
  console.log("Done creating tray.");
  createWindow();
  console.log("Done creating window");
  toggleWindow();

  globalShortcut.register("Control+Space", () => {
    toggleWindow();
  });



  // await DB.connect();
  //

  //
  //
  // const windowData = [
  //   {id: 1, appName: "mailspring", title: ""},
  //   {id: 2, appName: "spotify", title: "Spotify"},
  //   {id: 3, appName: "firefox", title: ""}
  // ];
  //
  // const windowEntities: Promise<any>[] = [];
  // for (const d of windowData) {
  //   const win = new Window();
  //   win.appName = d.appName;
  //   win.title = d.title;
  //   windowEntities.push(DB.connection.manager.save(win));
  // }
  //
  // await Promise.all(windowEntities);


});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

// Quit the app when the window is closed
app.on("window-all-closed", () => {
    app.quit();
});

const createTray = () => {
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
