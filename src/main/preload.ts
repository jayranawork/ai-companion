import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktopDevCat", {
  appName: "Desktop Dev Cat",
  getAppSettings: () => ipcRenderer.invoke("app-settings:get"),
  hideWindow: () => ipcRenderer.invoke("app-window:hide"),
  onAppSettingsChanged: (callback: (settings: import("../shared/appSettings").AppSettings) => void) => {
    const channel = "app-settings:changed";
    const listener = (_event: Electron.IpcRendererEvent, settings: import("../shared/appSettings").AppSettings) => {
      callback(settings);
    };

    ipcRenderer.on(channel, listener);

    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  },
  openLogs: () => ipcRenderer.invoke("app-logs:open"),
  resetWindowPosition: () => ipcRenderer.invoke("app-window:reset"),
  startWindowDrag: (screenX: number, screenY: number) => {
    ipcRenderer.send("window-drag:start", { screenX, screenY });
  },
  moveWindowDrag: (screenX: number, screenY: number) => {
    ipcRenderer.send("window-drag:move", { screenX, screenY });
  },
  endWindowDrag: () => {
    ipcRenderer.send("window-drag:end");
  },
  onWindowDragEdge: (callback: (contact: { bottom: boolean; left: boolean; right: boolean; top: boolean }) => void) => {
    const channel = "window-drag:edge";
    const listener = (_event: Electron.IpcRendererEvent, contact: { bottom: boolean; left: boolean; right: boolean; top: boolean }) => {
      callback(contact);
    };

    ipcRenderer.on(channel, listener);

    return () => {
      ipcRenderer.removeListener(channel, listener);
    };
  },
  setAppSettings: (patch: Partial<import("../shared/appSettings").AppSettings>) =>
    ipcRenderer.invoke("app-settings:set", patch),
  showWindow: () => ipcRenderer.invoke("app-window:show"),
  toggleWindow: () => ipcRenderer.invoke("app-window:toggle"),
  toggleAlwaysOnTop: (value: boolean) => ipcRenderer.invoke("app-settings:set", { alwaysOnTop: value }),
  toggleFocusMode: (value: boolean) => ipcRenderer.invoke("app-settings:set", { focusMode: value }),
  toggleLaunchAtStartup: (value: boolean) => ipcRenderer.invoke("app-settings:set", { launchAtStartup: value }),
  togglePaused: (value: boolean) => ipcRenderer.invoke("app-settings:set", { paused: value }),
});
