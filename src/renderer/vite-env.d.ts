/// <reference types="vite/client" />

import type { AppSettings } from "../shared/appSettings";
import type { AppRuntimeInfo } from "../shared/appRuntimeInfo";
import type { AppDevSignal } from "../shared/devSignal";

declare global {
  interface Window {
    desktopDevCat: {
      appName: string;
      getAppSettings: () => Promise<AppSettings>;
      getDevSignal: () => Promise<AppDevSignal | null>;
      getRuntimeInfo: () => Promise<AppRuntimeInfo>;
      hideWindow: () => Promise<void>;
      onAppSettingsChanged: (callback: (settings: AppSettings) => void) => () => void;
      onDevSignalChanged: (callback: (signal: AppDevSignal | null) => void) => () => void;
      onWindowRoamDirectionChanged: (callback: (direction: number) => void) => () => void;
      resetWindowPosition: () => Promise<void>;
      setWindowRoam: (enabled: boolean) => Promise<void>;
      startWindowDrag: (screenX: number, screenY: number) => void;
      moveWindowDrag: (screenX: number, screenY: number) => void;
      endWindowDrag: () => void;
      onWindowDragEdge: (
        callback: (contact: { bottom: boolean; left: boolean; right: boolean; top: boolean }) => void,
      ) => () => void;
      getWindowRoamState: () => Promise<boolean>;
      onWindowRoamStateChanged: (callback: (roaming: boolean) => void) => () => void;
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
