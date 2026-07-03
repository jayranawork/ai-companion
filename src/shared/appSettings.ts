export type AppSettings = {
  alwaysOnTop: boolean;
  focusMode: boolean;
  launchAtStartup: boolean;
  paused: boolean;
};

export const defaultAppSettings: AppSettings = {
  alwaysOnTop: true,
  focusMode: false,
  launchAtStartup: false,
  paused: false,
};
