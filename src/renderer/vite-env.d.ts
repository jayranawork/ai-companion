/// <reference types="vite/client" />

declare global {
  interface Window {
    desktopDevCat: {
      appName: string;
      startWindowDrag: (screenX: number, screenY: number) => void;
      moveWindowDrag: (screenX: number, screenY: number) => void;
      endWindowDrag: () => void;
    };
  }
}

export {};
