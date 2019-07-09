import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  Menu,
  MenuItem,
  Tray,
  screen,
  shell,
  ipcMain,
} from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { format as formatUrl } from "url";
import { ChildProcess, spawn,
  execFile
} from "child_process";
// import { Database } from "../backend/D¡atabase";
// import * as toCSV from "csv-stringify¡"

// import { Server } from "./Server";
// import { Application } from "../common/entities/Application";
// import { Platform } from "../common/Platform";
// import { DB } from "../common/DB";
import "reflect-metadata";
import Log from "electron-log";
// import { Browser } from "../backend/entities/Browser";
// import { Shell } from "../backend/entities/Shell";
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

// This is also defined in index.ts
const dbPath = path.join(app.getPath("userData"), "helm.db");
// const db = new Database(dbPath);

const studyDir = path.join(process.env["HOME"] || "", "/study");
try {
  fs.mkdirSync(studyDir);
  console.log(`Created study directory: ${studyDir}`);
} catch (err) {
  if (isDevelopment && err.code === "EEXIST") {
    console.warn("Study directory already exists. Some files might get overwritten.");
  } else {
    throw err;
  }
}



const screenRecordingFile = path.join(studyDir, "helm-screencapture.mkv");

let tray: Tray;
let mainWindow: BrowserWindow;
let backgroundWindow: BrowserWindow;

let trayMenu: Menu;

let captureProc: ChildProcess;
let captureStartTimestamp: number;
let captureEndTimestamp: number = 0;

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
    screenRecordingFile
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

    captureEndTimestamp = Date.now();
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

function msToTime(duration: number) {
  const seconds = Math.floor((duration / 1000) % 60);
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

const extractClips = async () => {
  const scriptPath = "/Users/ncbrad/Public/helm-study/extract-clips.R";


  execFile(scriptPath, [dbPath], (error, stdout, stderr) => {
    if (error) {
      dialog.showErrorBox("Extracting Clips Failed",`Encountered error when trying to extract clips: ${error.message}`);
    }

    // Get the video start time to use when computing clip offsets
    captureStartTimestamp = fs.statSync(screenRecordingFile).birthtimeMs;
    const duration = captureEndTimestamp - captureStartTimestamp;

    const seekLeadTime = 3000;  // 3s
    const clipDuration = 8;  // sec

    const records = stdout.trim().split("\n");
    for (let i = 1; i < records.length; i += 1) {
      const record = records[i].split(",");
      const type = JSON.parse(record[0]);
      const tool = JSON.parse(record[1]);
      const timestamp = new Date(record[2]).getTime();

      // It's possible that the trackers could be running for a bit before the screen recording starts so we don't to
      // include those. Same for timestamps after the recording has ended.
      if (timestamp >= (captureStartTimestamp + seekLeadTime) && timestamp < duration) {
        const outfile = path.join(studyDir, `${tool}-${type}-clip-${i}.mkv`);
        console.log(`Extracting clip to ${outfile}`);

        spawn("ffmpeg", [
          "-y",
          "-i", screenRecordingFile,
          "-ss", msToTime(timestamp - seekLeadTime - captureStartTimestamp),
          "-t", clipDuration.toString(),
          "-c", "copy",
          outfile
        ]);
      }
    }
  });


};

