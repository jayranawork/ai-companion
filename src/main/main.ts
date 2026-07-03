import { app, BrowserWindow, ipcMain, screen, shell } from "electron";
import path from "node:path";
import { createAppSettingsStore, readAppSettings, writeAppSettings } from "./appSettings";
import { createAppLogger } from "./logger";
import { createAppTray } from "./appTray";
import { createMainWindow } from "../window/createMainWindow";
import { defaultAppSettings, type AppSettings } from "../shared/appSettings";

let mainWindow: ReturnType<typeof createMainWindow> | null = null;
let restoreWindow: BrowserWindow | null = null;
let appSettingsStore: ReturnType<typeof createAppSettingsStore> | null = null;
let appSettings: AppSettings = defaultAppSettings;
let trayController: ReturnType<typeof createAppTray> | null = null;
let logFilePath = "";
let logger = null as ReturnType<typeof createAppLogger>["logger"] | null;
let quitting = false;
const dragAnchors = new Map<
  number,
  {
    offsetX: number;
    offsetY: number;
    timer: NodeJS.Timeout | null;
  }
>();

if (process.env.DESKTOP_DEV_CAT_DISABLE_GPU === "1") {
  app.disableHardwareAcceleration();
}

const restoreWindowHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root { color-scheme: dark; font-family: "Segoe UI", sans-serif; }
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      overflow: hidden;
    }
    body {
      display: grid;
      place-items: center;
      -webkit-user-select: none;
      user-select: none;
    }
    button {
      width: 100%;
      height: 100%;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 999px;
      background:
        radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.18), transparent 58%),
        rgba(13, 17, 25, 0.94);
      color: #f7efe0;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.01em;
      cursor: pointer;
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(14px);
    }
    button:hover {
      transform: translateY(-1px);
      background:
        radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.22), transparent 58%),
        rgba(21, 26, 38, 0.98);
    }
  </style>
</head>
<body>
  <button id="restore-button" type="button">Show Cat</button>
  <script>
    document.getElementById("restore-button").addEventListener("click", () => {
      window.desktopDevCat.showWindow();
    });
  </script>
</body>
</html>`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getClampedWindowPosition(window: BrowserWindow, nextX: number, nextY: number) {
  const bounds = window.getBounds();
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const workArea = display.workArea;
  const edgeMargin = 28;
  const topVisibleMargin = 40;
  const halfWidth = bounds.width / 2;
  const halfHeight = bounds.height / 2;

  const maxX =
    workArea.width <= bounds.width
      ? workArea.x
      : workArea.x + workArea.width - (halfWidth + edgeMargin);
  const minX =
    workArea.width <= bounds.width
      ? workArea.x
      : workArea.x - (halfWidth - edgeMargin);
  const maxY =
    workArea.height <= bounds.height
      ? workArea.y
      : workArea.y + workArea.height - (halfHeight + edgeMargin);
  const minY = workArea.height <= bounds.height ? workArea.y : workArea.y + topVisibleMargin;

  return {
    x: clamp(nextX, minX, maxX),
    y: clamp(nextY, minY, maxY),
  };
}

function sendSettingsChanged() {
  mainWindow?.webContents.send("app-settings:changed", appSettings);
  trayController?.update({
    ...appSettings,
    windowVisible: Boolean(mainWindow?.isVisible()),
  });
}

function syncSettingsPatch(patch: Partial<AppSettings>) {
  if (!appSettingsStore) {
    return appSettings;
  }

  appSettings = writeAppSettings(appSettingsStore, patch);

  if (logger) {
    logger.info({ patch, appSettings }, "App settings updated");
  }

  if (process.platform === "win32") {
    app.setLoginItemSettings({
      openAtLogin: appSettings.launchAtStartup,
    });
  }

  if (mainWindow) {
    mainWindow.setAlwaysOnTop(appSettings.alwaysOnTop, "screen-saver");
  }

  sendSettingsChanged();

  return appSettings;
}

function showWindow() {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
  hideRestoreWindow();
  sendSettingsChanged();
}

function hideWindow() {
  if (!mainWindow) {
    return;
  }

  mainWindow.hide();
  showRestoreWindow();
  sendSettingsChanged();
}

function toggleWindow() {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isVisible()) {
    hideWindow();
    return;
  }

  showWindow();
}

function resetWindowPosition() {
  if (!mainWindow) {
    return;
  }

  mainWindow.center();
  showWindow();
  if (logger) {
    logger.info("Window position reset");
  }
}

function openLogs() {
  if (!logFilePath) {
    return;
  }

  void shell.openPath(path.dirname(logFilePath));
}

function getRestoreWindowBounds() {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const workArea = display.workArea;
  const width = 116;
  const height = 40;
  const margin = 16;

  return {
    x: workArea.x + workArea.width - width - margin,
    y: workArea.y + workArea.height - height - margin,
    width,
    height,
  };
}

function createRestoreWindow() {
  if (restoreWindow && !restoreWindow.isDestroyed()) {
    return restoreWindow;
  }

  const bounds = getRestoreWindowBounds();
  restoreWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    backgroundColor: "#00000000",
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "../main/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  restoreWindow.setMenuBarVisibility(false);
  restoreWindow.setAlwaysOnTop(true, "screen-saver");
  restoreWindow.on("closed", () => {
    restoreWindow = null;
  });

  void restoreWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(restoreWindowHtml)}`);

  return restoreWindow;
}

function showRestoreWindow() {
  const window = createRestoreWindow();
  const bounds = getRestoreWindowBounds();
  window.setBounds(bounds);
  if (window.isMinimized()) {
    window.restore();
  }
  window.showInactive();
}

function hideRestoreWindow() {
  if (!restoreWindow || restoreWindow.isDestroyed()) {
    return;
  }

  restoreWindow.hide();
}

function registerWindowDragIpc() {
  ipcMain.on("window-drag:start", (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window) {
      return;
    }

    const [windowX, windowY] = window.getPosition();
    const existing = dragAnchors.get(event.sender.id);

    if (existing?.timer) {
      clearInterval(existing.timer);
    }

    const cursorPoint = screen.getCursorScreenPoint();

    const anchor = {
      offsetX: cursorPoint.x - windowX,
      offsetY: cursorPoint.y - windowY,
      timer: null as NodeJS.Timeout | null,
    };

    anchor.timer = setInterval(() => {
      const currentWindow = BrowserWindow.fromWebContents(event.sender);

      if (!currentWindow || currentWindow.isDestroyed()) {
        if (anchor.timer) {
          clearInterval(anchor.timer);
        }
        dragAnchors.delete(event.sender.id);
        return;
      }

      const cursorPoint = screen.getCursorScreenPoint();
      const nextX = Math.round(cursorPoint.x - anchor.offsetX);
      const nextY = Math.round(cursorPoint.y - anchor.offsetY);
      const clamped = getClampedWindowPosition(currentWindow, nextX, nextY);
      const edgeContact = {
        left: clamped.x !== nextX && nextX < clamped.x,
        right: clamped.x !== nextX && nextX > clamped.x,
        top: clamped.y !== nextY && nextY < clamped.y,
        bottom: clamped.y !== nextY && nextY > clamped.y,
      };

      if (edgeContact.left || edgeContact.right || edgeContact.top || edgeContact.bottom) {
        currentWindow.webContents.send("window-drag:edge", edgeContact);
      }

      currentWindow.setPosition(clamped.x, clamped.y);
    }, 16);

    dragAnchors.set(event.sender.id, {
      ...anchor,
    });
  });

  ipcMain.on("window-drag:move", () => {});

  ipcMain.on("window-drag:end", (event) => {
    const anchor = dragAnchors.get(event.sender.id);

    if (anchor?.timer) {
      clearInterval(anchor.timer);
    }

    dragAnchors.delete(event.sender.id);
  });

  app.on("web-contents-created", (_, contents) => {
    contents.once("destroyed", () => {
      const anchor = dragAnchors.get(contents.id);

      if (anchor?.timer) {
        clearInterval(anchor.timer);
      }

      dragAnchors.delete(contents.id);
    });
  });
}

function registerControlIpc() {
  ipcMain.handle("app-settings:get", () => appSettings);
  ipcMain.handle("app-settings:set", (_, patch: Partial<AppSettings>) => {
    return syncSettingsPatch(patch);
  });
  ipcMain.handle("app-window:show", () => {
    showWindow();
  });
  ipcMain.handle("app-window:hide", () => {
    hideWindow();
  });
  ipcMain.handle("app-window:toggle", () => {
    toggleWindow();
  });
  ipcMain.handle("app-window:reset", () => {
    resetWindowPosition();
  });
  ipcMain.handle("app-logs:open", () => {
    openLogs();
  });
}

function createTray() {
  const trayIconPath = path.join(app.getAppPath(), "public", "tray-icon.svg");
  trayController = createAppTray(trayIconPath, {
    openLogs,
    quit: () => {
      quitting = true;
      app.quit();
    },
    resetPosition: resetWindowPosition,
    setAlwaysOnTop: (value) => {
      syncSettingsPatch({ alwaysOnTop: value });
    },
    setFocusMode: (value) => {
      syncSettingsPatch({ focusMode: value });
    },
    setLaunchAtStartup: (value) => {
      syncSettingsPatch({ launchAtStartup: value });
    },
    setPaused: (value) => {
      syncSettingsPatch({ paused: value });
    },
    showWindow,
    hideWindow,
    toggleWindow,
  });

  trayController.update({
    ...appSettings,
    windowVisible: Boolean(mainWindow?.isVisible()),
  });
}

async function bootstrap(): Promise<void> {
  await app.whenReady();

  appSettingsStore = createAppSettingsStore();
  appSettings = readAppSettings(appSettingsStore);
  const loggerBundle = createAppLogger();
  logger = loggerBundle.logger;
  logFilePath = loggerBundle.logFilePath;

  logger.info({ logFilePath }, "Logger initialized");
  logger.info({ appSettings }, "Loading persisted app settings");

  if (process.platform === "win32") {
    app.setLoginItemSettings({
      openAtLogin: appSettings.launchAtStartup,
    });
  }

  registerWindowDragIpc();
  registerControlIpc();

  mainWindow = createMainWindow(appSettings.alwaysOnTop);
  mainWindow.on("close", (event) => {
    if (quitting) {
      return;
    }

    event.preventDefault();
    hideWindow();
  });
  mainWindow.on("show", () => {
    trayController?.update({
      ...appSettings,
      windowVisible: true,
    });
  });
  mainWindow.on("hide", () => {
    trayController?.update({
      ...appSettings,
      windowVisible: false,
    });
  });

  createTray();
  showWindow();

  app.on("activate", () => {
    if (mainWindow === null) {
      mainWindow = createMainWindow(appSettings.alwaysOnTop);
    }
    showWindow();
  });
}

app.on("before-quit", () => {
  quitting = true;
  trayController?.destroy();
  trayController = null;
  if (restoreWindow && !restoreWindow.isDestroyed()) {
    restoreWindow.destroy();
  }
  restoreWindow = null;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

void bootstrap();
