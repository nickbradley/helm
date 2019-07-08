import { app, BrowserWindow, dialog, globalShortcut, Menu, MenuItem, Tray, screen, shell, ipcMain } from "electron";
// import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { format as formatUrl } from "url";
import { ChildProcess, spawn } from "child_process";
// import { Server } from "./Server";
// import { Application } from "../common/entities/Application";
// import { Platform } from "../common/Platform";
// import { DB } from "../common/DB";
import "reflect-metadata";
import Log from "electron-log";
// import MenuItem = Electron.MenuItem;
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

let trayMenu: Menu;

let captureProc: ChildProcess;

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
  // const assestPath = path.join(staticPath, '/static').replace(/\\/g, '\\\\');
  console.log("staticPath", staticPath);
  tray = new Tray(path.join(staticPath, "/helm_128.png"));
  trayMenu = Menu.buildFromTemplate([
    {
      id: "show-ui",
      label: "Show launcher",
      click() {
        showWindow();
      }
    },
    {
      id: "hide-ui",
      label: "Hide launcher",
      visible: false,
      click(me: MenuItem) {
        hideWindow();
      },
    },
    {
      type: "separator"
    },
    {
      id: "show-db",
      label: "Show database file",
      click() { shell.showItemInFolder(""); }
    },
    {
      id: "start-recording",
      label: "Start recording",
      click() { startRecording(); }
    },
    {
      id: "stop-recording",
      label: "Stop recording",
      visible: false,
      click() { stopRecording(); }
    },
    {
      id: "extract-clips",
      label: "Extract study clips",
      click() { extractClips(); }
    },
    {
      type: "separator"
    },
    {
      label: "Exit",
      click() {
        app.quit();
      }
    }
  ]);
  tray.setToolTip("Helm Launcher");
  tray.setContextMenu(trayMenu);
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

  // Update tray menu
  trayMenu.getMenuItemById("show-ui").visible = false;
  trayMenu.getMenuItemById("hide-ui").visible = true;
};

const hideWindow = () => {
  globalShortcut.unregister("Escape");
  mainWindow.hide();

  // Update tray menu
  trayMenu.getMenuItemById("show-ui").visible = true;
  trayMenu.getMenuItemById("hide-ui").visible = false;
};

const startRecording = () => {
  const outputFile = "helm-screencapture.mkv";
  const screenIndex = "1";  // you can see the options with: ffmpeg -f avfoundation -list_devices true -i ""
  const ffmpegOpts = [
    "-y",
    "-f", "avfoundation",
    "-i", `${screenIndex}:none`,  // video_device_index:audio_device_index
    "-capture_cursor", "1",
    "-capture_mouse_clicks", "1",
    "-vcodec", "hevc_videotoolbox",  // apparently this codec sucks but is the only way to do hardware encoding on MacOS
    "-b:v", "6000k",
    "-tag:v", "hvc1",
    "-profile:v", "main10",
    path.join(process.env["HOME"] || "", outputFile)
  ];
  // console.log("CMD", "ffmpeg", ffmpegOpts.join(" "));

  /*
  ffmpeg -f avfoundation -i "1" test.mpeg

  // https://ffmpeg.org/ffmpeg-devices.html#avfoundation
  ffmpeg -f avfoundation  -pixel_format yuv420p -capture_cursor 1 -capture_mouse_clicks 1 -framerate 25 -i "1:none" -b:v 8000k -c:v hevc_videotoolbox -profile:v main10 -crf 0 -preset ultrafast test.mkv
  ffmpeg -f avfoundation -i "1" -c:v hevc_videotoolbox  -crf 0 test.mkv
  ffmpeg -f avfoundation -pixel_format bgr0 -i "1:none"  -c:v hevc_videotoolbox  -crf 0 -preset ultrafast test.mkv

  yuv420p
   */

  captureProc = spawn("ffmpeg", ffmpegOpts, { stdio: ["pipe", "ignore", "ignore"] });

  // const out = fs.createWriteStream(path.join(process.env["HOME"] || "", "helm-ffmpeg.log"));
  // captureProc.stdout!.pipe(out);
  // captureProc.stderr!.pipe(out);

  captureProc.on("error", (err) => {
    Log.error(err);
    stopRecording();
  });

  captureProc.on("close", (code: number) => {
    if (code !== 0) {
      dialog.showErrorBox("Recording Failed","ffmpeg exited with a non-zero exit code.");
    }

    trayMenu.getMenuItemById("start-recording").visible = true;
    trayMenu.getMenuItemById("stop-recording").visible = false;
  });

  // Update tray menu
  trayMenu.getMenuItemById("start-recording").visible = false;
  trayMenu.getMenuItemById("stop-recording").visible = true;
};

const stopRecording = () => {
  if (captureProc && captureProc.stdin) {
    captureProc.stdin.write("q");
  }
};

const extractClips = () => {

};

