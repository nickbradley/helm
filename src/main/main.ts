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
  ipcMain
} from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { format as formatUrl } from "url";
import { ChildProcess, spawn,
  execFile
} from "child_process";
import "reflect-metadata";
import Log from "electron-log";
import {Database} from "../backend/Database";
import { Platform } from "../common/Platform";
import { Application } from "../backend/entities/Application";
import {getRepository} from "typeorm";

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
Log.transports.file.fileName = "main.log";



const configFile = path.join(app.getPath("userData"), "helmconfig.json");
let config: {[key: string]: any};
try {
  Log.info(`Reading config file from ${configFile}`);
  config = JSON.parse(fs.readFileSync(configFile, "utf8"));
} catch (err) {
  Log.error(`<FATAL> Failed to read ${configFile}. Please ensure the file exists and is valid JSON.`);
  throw err;
}


const studyDir = path.join(process.env["HOME"] || "", "/study");
try {
  fs.mkdirSync(studyDir);
  Log.info(`Created study directory: ${studyDir}`);
} catch (err) {
  if (isDevelopment && err.code === "EEXIST") {
    Log.warn("Study directory already exists. Some files might get overwritten.");
  } else {
    dialog.showErrorBox("Failed to create study directory.", `Couldn't create ${studyDir}: ${err}`);
    app.exit(1);
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
  // TODO This is a hack: for some reason most of typeorm's functionality works in the background renderer process but not loading the application data; so we do that in main.
  // Should probably make the background renderer process a plain node process and figure out all the webpack ugliness that goes with that.
  await new Database(config["dbPath"]).connect();
  Log.info("Main::ready() - Loading application data...");
  await loadHostApplications();

  createTray();
  createWindow();

  // toggleWindow();
  globalShortcut.register("Control+Space", () => {
    toggleWindow();
  });
});

// app.on("will-quit", async () => {
//   // await server.stop();
//   // globalShortcut.unregisterAll();
//   app.quit();
// });
//
// // Quit the app when the window is closed
// app.on("window-all-closed", () => {
//   app.quit();
// });

// @ts-ignore
const createTray = () => {
  Log.info("Creating tray...");
  // const assestPath = path.join(staticPath, '/static').replace(/\\/g, '\\\\');

  tray = new Tray(path.join(staticPath, "/status.png"));
  tray.setPressedImage(path.join(staticPath, "/status-white.png"));
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
      label: "Show UI devtools",
      click() { mainWindow.webContents.openDevTools({mode: "detach"}); }
    },
    {
      label: "Show daemon devtools",
      click() { backgroundWindow.webContents.openDevTools({mode: "detach"}); }
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
  Log.info("Creating windows...");
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

    mainWindow.hide();
  }

  // Hide the window when it loses focus
  mainWindow.on("blur", () => {
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });

  if (isDevelopment) {
    mainWindow.webContents.on("did-frame-finish-load", () => {
      mainWindow.webContents.openDevTools();
      mainWindow.webContents.on("devtools-opened", () => {
        mainWindow.focus();
      });
    });
    backgroundWindow.webContents.on("did-frame-finish-load", () => {
      backgroundWindow.webContents.openDevTools();
      backgroundWindow.webContents.on("devtools-opened", () => {
        mainWindow.focus();
      });
    });
  }


  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
    backgroundWindow.webContents.openDevTools();
  }
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

  captureProc = spawn("/usr/local/bin/ffmpeg", ffmpegOpts, { stdio: ["pipe", "ignore", "ignore"] });

  // const out = fs.createWriteStream(path.join(process.env["HOME"] || "", "helm-ffmpeg.log"));
  // captureProc.stdout!.pipe(out);
  // captureProc.stderr!.pipe(out);

  captureProc.on("error", (err) => {
    Log.error(err);
    trayMenu.getMenuItemById("start-recording").visible = true;
    trayMenu.getMenuItemById("stop-recording").visible = false;
    dialog.showErrorBox("Recording Failed", `Failed to start ffmpeg: ${err}`);
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


  execFile(scriptPath, [config["dbPath"]], (error: any, stdout: any, stderr: any) => {
    if (error) {
      dialog.showErrorBox("Extracting Clips Failed",`Encountered error when trying to extract clips: ${error.message}`);
    }

    // Get the video start time to use when computing clip offsets
    captureStartTimestamp = fs.statSync(screenRecordingFile).birthtimeMs;
    const duration = captureEndTimestamp - captureStartTimestamp;

    const thrashSeekLeadTime = 3000;  // 3s
    const thrashClipDuration = 8;  // sec
    const initSeekLeadTime = 20000;
    const initClipDuration = 25;

    const records = stdout.trim().split("\n");
    for (let i = 1; i < records.length; i += 1) {
      const record = records[i].split(",");
      const type = JSON.parse(record[0]);
      const tool = JSON.parse(record[1]);
      const timestamp = new Date(record[2]).getTime();

      // It's possible that the trackers could be running for a bit before the screen recording starts so we don't to
      // include those. Same for timestamps after the recording has ended.
      if (timestamp >= (captureStartTimestamp + thrashSeekLeadTime) && timestamp < duration) {
        const outfile = path.join(studyDir, `${tool}-${type}-clip-${i}.mkv`);
        Log.verbose(`Extracting clip to ${outfile}`);

        spawn("/usr/local/bin/ffmpeg", [
          "-y",
          "-i", screenRecordingFile,
          "-ss", msToTime(timestamp - (type === "init" ? initSeekLeadTime : thrashSeekLeadTime) - captureStartTimestamp),
          "-t", (type === "init" ? initClipDuration : thrashClipDuration).toString(),
          "-c", "copy",
          outfile
        ]);
      }
    }
  });
};

// @ts-ignore
const loadHostApplications = async () => {
  const applications = Platform.listApplications();
  const appEntities: Application[] = [];

  for (const app of applications) {
    const application = new Application();
    application.name = app.name.toLowerCase();
    application.icon = app.icon;
    application.path = app.path;

    if (!appEntities.some(e => e.name === application.name)) {
      appEntities.push(application);
    }
  }

  return await getRepository(Application).save(appEntities);
};

