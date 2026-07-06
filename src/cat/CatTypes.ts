import type { Texture } from "pixi.js";

export type CatState =
  | "idle"
  | "curious"
  | "dragging"
  | "walking"
  | "stretching"
  | "sleeping"
  | "happy"
  | "angry";

export type CatAnimationKey =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "fall"
  | "hurt"
  | "dead"
  | "slide";

export type CatEventName =
  | "CAT_STATE_CHANGE"
  | "CAT_DRAG_START"
  | "CAT_DRAG_END"
  | "CAT_ASSETS_READY"
  | "CAT_REMINDER";

export type CatAnimationLibrary = Record<CatAnimationKey, Texture[]>;

export type CatAnimationDefinition = {
  loop: boolean;
  name: CatAnimationKey;
  speed: number;
};

export type ReminderKind =
  | "stretch"
  | "coffee"
  | "focus"
  | "water"
  | "debug"
  | "build"
  | "git";

export type CatReminder = {
  kind: ReminderKind;
  message: string;
};

export type CustomReminder = {
  enabled: boolean;
  id: string;
  kind: ReminderKind;
  message: string;
  time: string;
};
