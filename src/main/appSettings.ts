import Store from "electron-store";
import { app } from "electron";
import { defaultAppSettings, type AppSettings } from "../shared/appSettings";

export type AppSettingsPatch = Partial<AppSettings>;

function resolveStoreDirectory() {
  return process.env.DESKTOP_DEV_CAT_USER_DATA_DIR ?? app.getPath("userData");
}

export function createAppSettingsStore() {
  return new Store<AppSettings>({
    name: "settings",
    cwd: resolveStoreDirectory(),
    defaults: defaultAppSettings,
  });
}

export function readAppSettings(store: Store<AppSettings>): AppSettings {
  return {
    alwaysOnTop: store.get("alwaysOnTop"),
    focusMode: store.get("focusMode"),
    launchAtStartup: store.get("launchAtStartup"),
    paused: store.get("paused"),
  };
}

export function writeAppSettings(store: Store<AppSettings>, patch: AppSettingsPatch): AppSettings {
  store.set(patch);
  return readAppSettings(store);
}
