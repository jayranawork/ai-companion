import { BrowserWindow } from "electron";
import path from "node:path";
import { APP_NAME, DEFAULT_WINDOW_SIZE } from "../shared/constants";

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    title: APP_NAME,
    width: DEFAULT_WINDOW_SIZE.width,
    height: DEFAULT_WINDOW_SIZE.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    hasShadow: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "../main/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.setMenuBarVisibility(false);
  window.setAlwaysOnTop(true, "screen-saver");

  if (isDev) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL!);
    if (process.env.OPEN_DEVTOOLS === "true") {
      window.webContents.openDevTools({ mode: "detach" });
    }
  } else {
    void window.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  return window;
}
