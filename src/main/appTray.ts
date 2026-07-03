import { Menu, Tray, nativeImage } from "electron";
import type { AppSettings } from "../shared/appSettings";

export type TrayActions = {
  quit: () => void;
  resetPosition: () => void;
  setAlwaysOnTop: (value: boolean) => void;
  setFocusMode: (value: boolean) => void;
  setLaunchAtStartup: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  showWindow: () => void;
  hideWindow: () => void;
  toggleWindow: () => void;
};

export type TrayState = AppSettings & {
  windowVisible: boolean;
};

export function createAppTray(iconPath: string, actions: TrayActions) {
  const trayIcon = nativeImage.createFromPath(iconPath);
  const tray = new Tray(trayIcon);

  const buildMenu = (state: TrayState) =>
    Menu.buildFromTemplate([
      {
        label: state.windowVisible ? "Hide Cat" : "Show Cat",
        click: state.windowVisible ? actions.hideWindow : actions.showWindow,
      },
      {
        label: "Reset Position",
        click: actions.resetPosition,
      },
      { type: "separator" },
      {
        label: state.paused ? "Resume Behavior" : "Pause Behavior",
        click: () => actions.setPaused(!state.paused),
      },
      {
        type: "checkbox",
        label: "Focus Mode",
        checked: state.focusMode,
        click: () => actions.setFocusMode(!state.focusMode),
      },
      {
        type: "checkbox",
        label: "Always on Top",
        checked: state.alwaysOnTop,
        click: () => actions.setAlwaysOnTop(!state.alwaysOnTop),
      },
      {
        type: "checkbox",
        label: "Launch at Startup",
        checked: state.launchAtStartup,
        click: () => actions.setLaunchAtStartup(!state.launchAtStartup),
      },
      {
        label: "Quit",
        click: actions.quit,
      },
    ]);

  tray.setToolTip("Desktop Dev Cat");
  tray.on("click", () => actions.toggleWindow());

  return {
    tray,
    update(state: TrayState) {
      tray.setContextMenu(buildMenu(state));
    },
    destroy() {
      tray.destroy();
    },
  };
}
