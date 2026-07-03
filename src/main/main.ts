import { app, BrowserWindow, ipcMain, screen } from "electron";
import { createMainWindow } from "../window/createMainWindow";

let mainWindow: ReturnType<typeof createMainWindow> | null = null;
const dragAnchors = new Map<
  number,
  {
    offsetX: number;
    offsetY: number;
    timer: NodeJS.Timeout | null;
  }
>();

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
      currentWindow.setPosition(nextX, nextY);
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

async function bootstrap(): Promise<void> {
  await app.whenReady();
  registerWindowDragIpc();

  mainWindow = createMainWindow();

  app.on("activate", () => {
    if (mainWindow === null) {
      mainWindow = createMainWindow();
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

void bootstrap();
