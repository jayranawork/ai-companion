/// <reference types="vite/client" />

import type { AppSettings } from "../shared/appSettings";

declare global {
  interface Window {
    desktopDevCat: {
      appName: string;
      getAppSettings: () => Promise<AppSettings>;
      hideWindow: () => Promise<void>;
      onAppSettingsChanged: (callback: (settings: AppSettings) => void) => () => void;
      openLogs: () => Promise<void>;
      resetWindowPosition: () => Promise<void>;
      startWindowDrag: (screenX: number, screenY: number) => void;
      moveWindowDrag: (screenX: number, screenY: number) => void;
      endWindowDrag: () => void;
      onWindowDragEdge: (
        callback: (contact: { bottom: boolean; left: boolean; right: boolean; top: boolean }) => void,
      ) => () => void;
      setAppSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
      showWindow: () => Promise<void>;
      toggleAlwaysOnTop: (value: boolean) => Promise<void>;
      toggleFocusMode: (value: boolean) => Promise<void>;
      toggleLaunchAtStartup: (value: boolean) => Promise<void>;
      togglePaused: (value: boolean) => Promise<void>;
      toggleWindow: () => Promise<void>;
    };
  }
}

export {};
