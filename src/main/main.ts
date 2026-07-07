import { app, BrowserWindow, ipcMain, screen } from "electron";
import { existsSync, mkdirSync, readFileSync, watch as watchFile } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createAppSettingsStore, readAppSettings, writeAppSettings } from "./appSettings";
import { createAppTray } from "./appTray";
import { createMainWindow } from "../window/createMainWindow";
import { defaultAppSettings, type AppSettings } from "../shared/appSettings";
import type { AppRuntimeInfo } from "../shared/appRuntimeInfo";
import type { AppDevSignal } from "../shared/devSignal";

let mainWindow: ReturnType<typeof createMainWindow> | null = null;
let restoreWindow: BrowserWindow | null = null;
let appSettingsStore: ReturnType<typeof createAppSettingsStore> | null = null;
let appSettings: AppSettings = defaultAppSettings;
let trayController: ReturnType<typeof createAppTray> | null = null;
let devSignalWatcher: ReturnType<typeof watchFile> | null = null;
let devSignal: AppDevSignal | null = null;
let roamTimer: NodeJS.Timeout | null = null;
let roamRequested = false;
let roamDirection = 1;
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
    const button = document.getElementById("restore-button");
    const updateButton = (roaming) => {
      button.textContent = roaming ? "Stop Walking" : "Show Cat";
    };

    window.desktopDevCat.getWindowRoamState().then(updateButton);
    window.desktopDevCat.onWindowRoamStateChanged(updateButton);

    button.addEventListener("click", () => {
      window.desktopDevCat.getWindowRoamState().then((roaming) => {
        if (roaming) {
          window.desktopDevCat.setWindowRoam(false);
          return;
        }

        window.desktopDevCat.showWindow();
      });
    });
  </script>
</body>
</html>`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isSafeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getClampedWindowPosition(window: BrowserWindow, nextX: number, nextY: number) {
  const bounds = window.getBounds();
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const workArea = display.workArea;
  const edgeMargin = 28;
  const topVisibleMargin = 56;
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

function sendRoamDirectionChanged() {
  mainWindow?.webContents.send("app-window:roam-direction", roamDirection);
}

function sendRoamStateChanged() {
  mainWindow?.webContents.send("app-window:roam-state:changed", roamRequested);
  restoreWindow?.webContents.send("app-window:roam-state:changed", roamRequested);
}

function resolveDevSignalPath() {
  const baseDir = process.env.DESKTOP_DEV_CAT_SIGNAL_DIR ?? path.join(os.homedir(), ".desktop-dev-cat");
  return path.join(baseDir, "activity-signal.json");
}

function sendDevSignalChanged() {
  mainWindow?.webContents.send("app-dev-signal:changed", devSignal);
}

function readDevSignalFromDisk() {
  const signalPath = resolveDevSignalPath();

  if (!existsSync(signalPath)) {
    devSignal = null;
    sendDevSignalChanged();
    return;
  }

  try {
    const raw = readFileSync(signalPath, "utf8");
    const parsed = JSON.parse(raw) as AppDevSignal;

    if (
      typeof parsed?.source === "string" &&
      typeof parsed?.status === "string" &&
      typeof parsed?.message === "string" &&
      typeof parsed?.updatedAt === "number"
    ) {
      devSignal = parsed;
      sendDevSignalChanged();
      return;
    }
  } catch {
    // Ignore malformed dev-only signal files.
  }

  devSignal = null;
  sendDevSignalChanged();
}

function watchDevSignalFile() {
  const signalPath = resolveDevSignalPath();
  const signalDir = path.dirname(signalPath);

  if (devSignalWatcher) {
    devSignalWatcher.close();
    devSignalWatcher = null;
  }

  mkdirSync(signalDir, { recursive: true });

  try {
    devSignalWatcher = watchFile(signalDir, { persistent: false }, (eventType, filename) => {
      if (!filename) {
        return;
      }

      if (filename !== path.basename(signalPath)) {
        return;
      }

      if (eventType === "rename" || eventType === "change") {
        readDevSignalFromDisk();
      }
    });
  } catch {
    devSignalWatcher = null;
  }
}

function getRuntimeInfo(): AppRuntimeInfo {
  return {
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron ?? "",
    chromeVersion: process.versions.chrome ?? "",
    nodeVersion: process.versions.node ?? "",
    platform: process.platform,
    isPackaged: app.isPackaged,
  };
}

function syncSettingsPatch(patch: Partial<AppSettings>) {
  if (!appSettingsStore) {
    return appSettings;
  }

  appSettings = writeAppSettings(appSettingsStore, patch);

  if (Object.prototype.hasOwnProperty.call(patch, "paused")) {
    if (patch.paused) {
      stopWindowRoam(true);
    } else if (roamRequested) {
      startWindowRoam();
    }
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
}

function getRestoreWindowBounds() {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const workArea = display.workArea;
  const width = 132;
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

function stopWindowRoam(preserveRequest = false) {
  if (!preserveRequest) {
    roamRequested = false;
    sendRoamStateChanged();
    hideRestoreWindow();
  }

  if (roamTimer) {
    clearInterval(roamTimer);
    roamTimer = null;
  }
}

function startWindowRoam() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  roamRequested = true;
  sendRoamStateChanged();
  showRestoreWindow();
  stopWindowRoam(true);
  roamDirection = mainWindow.getPosition()[0] < 0 ? 1 : -1;
  sendRoamDirectionChanged();

  roamTimer = setInterval(() => {
    try {
      const window = mainWindow;

      if (!window || window.isDestroyed()) {
        stopWindowRoam();
        return;
      }

      if (!window.isVisible()) {
        return;
      }

      const bounds = window.getBounds();
      const display = screen.getDisplayMatching(bounds);
      const workArea = display.workArea;
      const speed = 3.2;
      const edgeMargin = 6;
      const topVisibleMargin = 22;
      const halfWidth = bounds.width / 2;
      const halfHeight = bounds.height / 2;
      const minX = workArea.x - (halfWidth - edgeMargin);
      const maxX = workArea.x + workArea.width - (halfWidth + edgeMargin);
      const minY = workArea.y + topVisibleMargin;
      const maxY = workArea.y + workArea.height - (halfHeight + edgeMargin);
      if (
        !isSafeFiniteNumber(bounds.width) ||
        !isSafeFiniteNumber(bounds.height) ||
        !isSafeFiniteNumber(workArea.x) ||
        !isSafeFiniteNumber(workArea.y) ||
        !isSafeFiniteNumber(workArea.width) ||
        !isSafeFiniteNumber(workArea.height)
      ) {
        console.warn("[roam] skipping tick because bounds or work area were invalid", {
          bounds,
          workArea,
        });
        return;
      }
      const [currentX, currentY] = window.getPosition();
      const safeCurrentX = Number.isFinite(currentX) ? currentX : workArea.x;
      const safeCurrentY = Number.isFinite(currentY) ? currentY : workArea.y;
      const nextX = safeCurrentX + roamDirection * speed;
      const nextY = clamp(safeCurrentY, minY, maxY);

      if (nextX <= minX || nextX >= maxX) {
        roamDirection *= -1;
        sendRoamDirectionChanged();
        window.webContents.send("window-drag:edge", {
          left: nextX <= minX,
          right: nextX >= maxX,
          top: false,
          bottom: false,
        });
      }

      const targetX = Math.trunc(
        clamp(Number.isFinite(nextX) ? nextX : safeCurrentX, minX, maxX),
      );
      const targetY = Math.trunc(Number.isFinite(nextY) ? nextY : safeCurrentY);

      if (Number.isFinite(targetX) && Number.isFinite(targetY)) {
        try {
          window.setPosition(targetX, targetY);
        } catch (positionError) {
          console.error("[roam] failed to set position", {
            targetX,
            targetY,
            bounds,
            workArea,
            positionError,
          });
          stopWindowRoam();
        }
      } else {
        console.warn("[roam] skipping invalid target position", {
          targetX,
          targetY,
          bounds,
          workArea,
        });
      }
    } catch (error) {
      console.error("[roam] roaming tick failed", error);
      stopWindowRoam();
    }
  }, 16);
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
  ipcMain.handle("app-runtime:get", () => getRuntimeInfo());
  ipcMain.handle("app-dev-signal:get", () => devSignal);
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
  ipcMain.handle("app-window:roam-state", () => roamRequested);
  ipcMain.handle("app-window:roam", (_, enabled: boolean) => {
    if (enabled) {
      startWindowRoam();
    } else {
      stopWindowRoam();
    }
  });
}

function createTray() {
  const trayIconPath = path.join(app.getAppPath(), "public", "tray-icon.svg");
  trayController = createAppTray(trayIconPath, {
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
  readDevSignalFromDisk();
  watchDevSignalFile();

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
  if (devSignalWatcher) {
    devSignalWatcher.close();
    devSignalWatcher = null;
  }
  if (restoreWindow && !restoreWindow.isDestroyed()) {
    restoreWindow.destroy();
  }
  restoreWindow = null;
  stopWindowRoam();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

void bootstrap();
