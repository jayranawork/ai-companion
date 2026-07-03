import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktopDevCat", {
  appName: "Desktop Dev Cat",
  startWindowDrag: (screenX: number, screenY: number) => {
    ipcRenderer.send("window-drag:start", { screenX, screenY });
  },
  moveWindowDrag: (screenX: number, screenY: number) => {
    ipcRenderer.send("window-drag:move", { screenX, screenY });
  },
  endWindowDrag: () => {
    ipcRenderer.send("window-drag:end");
  },
});
