import type { ReminderKind } from "./CatTypes";

export type ReminderContent = {
  accentColor: number;
  message: string;
  badgeLabel: string;
  strokeColor: number;
  title: string;
};

export const reminderKindOptions: Array<{
  description: string;
  label: string;
  value: ReminderKind;
}> = [
  {
    value: "focus",
    label: "Focus break",
    description: "A quick reset between deep work sessions.",
  },
  {
    value: "stretch",
    label: "Stretch reset",
    description: "Stand up and give your body a quick reset.",
  },
  {
    value: "coffee",
    label: "Coffee reset",
    description: "Grab a cup and come back with fresh eyes.",
  },
  {
    value: "water",
    label: "Hydrate",
    description: "A small reminder to drink water and keep going.",
  },
  {
    value: "debug",
    label: "Debug pause",
    description: "Step back, breathe, and check the error again.",
  },
  {
    value: "build",
    label: "Build check",
    description: "Confirm the last change still compiles cleanly.",
  },
  {
    value: "git",
    label: "Git check-in",
    description: "Capture the good work before it drifts away.",
  },
];

const reminderContentMap: Record<ReminderKind, ReminderContent> = {
  focus: {
    title: "Focus break",
    message: "You've been in the zone for a while. Stand up, blink, and reset.",
    badgeLabel: "FCS",
    accentColor: 0xe9b96f,
    strokeColor: 0x2a2f36,
  },
  stretch: {
    title: "Stretch reset",
    message: "Time to stretch. Unclench your shoulders and come back looser.",
    badgeLabel: "STR",
    accentColor: 0xd7c39a,
    strokeColor: 0x2a2f36,
  },
  coffee: {
    title: "Coffee reset",
    message: "Grab a coffee, save your thought, and let the next idea settle.",
    badgeLabel: "CAF",
    accentColor: 0xc7894a,
    strokeColor: 0x5b3b18,
  },
  water: {
    title: "Hydrate",
    message: "Quick water break. Your future brain will thank you.",
    badgeLabel: "WTR",
    accentColor: 0x7fb4e8,
    strokeColor: 0x24517a,
  },
  debug: {
    title: "Debug pause",
    message: "Step back for a minute, then read the error like it owes you money.",
    badgeLabel: "DBG",
    accentColor: 0xd9a3a3,
    strokeColor: 0x7c3232,
  },
  build: {
    title: "Build check",
    message: "Run the build, trust the feedback, and keep the pipeline honest.",
    badgeLabel: "BLD",
    accentColor: 0x9db5d4,
    strokeColor: 0x2f4a74,
  },
  git: {
    title: "Git check-in",
    message: "Commit the useful bit while it is still fresh in your head.",
    badgeLabel: "GIT",
    accentColor: 0xa7d8a5,
    strokeColor: 0x2f6b38,
  },
};

export function getReminderContent(kind: ReminderKind) {
  return reminderContentMap[kind];
}
