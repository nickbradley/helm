import {
  app,
  BrowserWindow,
  globalShortcut,
  Menu,
  Tray,
  screen
} from "electron";
import * as path from "path";
import { format as formatUrl } from "url";

declare const __static: string;
const isDevelopment = process.env.NODE_ENV !== "production";
// https://github.com/electron-userland/electron-webpack/issues/52#issuecomment-362316068
const staticPath = isDevelopment ? __static : __dirname.replace(/app\.asar$/, "static");

// Keep reference to avoid being garbage collected
let mainWindow: BrowserWindow;
let tray: Tray;
let trayMenu: Menu;

app.on("ready", async () => {
  createTray();
  await createWindow();

  globalShortcut.register("Control+Space", () => {
    toggleWindow();
  });
});

const createTray = () => {
  tray = new Tray(path.join(staticPath, "/status.png"));
  tray.setPressedImage(path.join(staticPath, "/status-white.png"));
  tray.setToolTip("Helm Launcher");
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
      click() {
        mainWindow.hide();
      }
    },
    {
      label: "Show devtools",
      click() {
        mainWindow.webContents.openDevTools({ mode: "detach" });
      }
    },
    {
      type: "separator"
    },
    {
      label: "Exit",
      click() {
        globalShortcut.unregisterAll();
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(trayMenu);
};

const createWindow = async () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const options = {
    width: 0.66 * width,
    height: 0.66 * height,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      webSecurity: false,     // This should be disabled in production
      nodeIntegration: true,  // This should be disabled in production
      webviewTag: true,       // Might want to consider if there is a better way to preview web pages
    }
  };

  if (isDevelopment) {
    options.frame = true;
    options.fullscreenable = true;
    options.resizable = true;
    options.skipTaskbar = false;
    options.show = true;

    mainWindow = new BrowserWindow(options);
    await mainWindow.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);

    mainWindow.webContents.on("did-frame-finish-load", () => {
      mainWindow.webContents.openDevTools({ mode: "detach", activate: false });
    });
  } else {
    mainWindow = new BrowserWindow(options);
    await mainWindow.loadURL(formatUrl({
      pathname: path.join(__dirname, "index.html"),
      protocol: "file",
      slashes: true
    }));
  }

  // Hide the window when it loses focus
  mainWindow.on("blur", () => {
    trayMenu.getMenuItemById("show-ui").visible = true;
    trayMenu.getMenuItemById("hide-ui").visible = false;
    if (!mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.hide();
    }
  });

  mainWindow.on("focus", () => {
    trayMenu.getMenuItemById("show-ui").visible = false;
    trayMenu.getMenuItemById("hide-ui").visible = true;
    mainWindow.webContents.send("window-focused");
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "Escape") {
      mainWindow.hide();
    }
  });
};

const toggleWindow = () => {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showWindow();
  }
};

const getWindowPosition = () => {
  const windowBounds = mainWindow.getBounds();
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Center window on primary monitor
  const x = Math.round((width / 2) - (windowBounds.width / 2));
  const y = Math.round((height / 2) - (windowBounds.height / 2));

  return { x, y };
};

const showWindow = () => {
  const position = getWindowPosition();
  mainWindow.setPosition(position.x, position.y, false);
  mainWindow.show();
  mainWindow.focus();
};
