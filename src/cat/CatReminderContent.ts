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
  {
    value: "lint",
    label: "Lint nudge",
    description: "The code wants one more tidy pass.",
  },
  {
    value: "refactor",
    label: "Refactor ping",
    description: "A tiny nudge to shape the messy bit into something nicer.",
  },
  {
    value: "test",
    label: "Test tap",
    description: "A friendly poke to run the tests before the moment passes.",
  },
  {
    value: "push",
    label: "Push reminder",
    description: "A tiny voice that says the branch deserves to leave home.",
  },
  {
    value: "logs",
    label: "Log glance",
    description: "Look back at the logs before they vanish into the void.",
  },
  {
    value: "break",
    label: "Micro break",
    description: "A small reset so your brain can keep being useful.",
  },
  {
    value: "panic",
    label: "Panic pause",
    description: "Breathe first. The bug is rarely as dramatic as it sounds.",
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
  lint: {
    title: "Lint nudge",
    message: "Tiny cleanup time. The linter has opinions and, annoyingly, it is sometimes right.",
    badgeLabel: "LNT",
    accentColor: 0xc9d6ff,
    strokeColor: 0x334a8d,
  },
  refactor: {
    title: "Refactor ping",
    message: "This is the part where you make future-you feel a little less trapped.",
    badgeLabel: "RFX",
    accentColor: 0xd7b2e6,
    strokeColor: 0x5d3270,
  },
  test: {
    title: "Test tap",
    message: "Run the tests once. Then you get to argue with reality using evidence.",
    badgeLabel: "TST",
    accentColor: 0xb9e3c5,
    strokeColor: 0x2e6a43,
  },
  push: {
    title: "Push reminder",
    message: "Your branch has done enough hiding. Time to send it out into the world.",
    badgeLabel: "PUSH",
    accentColor: 0xf0c38e,
    strokeColor: 0x86551f,
  },
  logs: {
    title: "Log glance",
    message: "The logs are still talking. Catch the useful line before it disappears.",
    badgeLabel: "LOG",
    accentColor: 0xa8d8f0,
    strokeColor: 0x225d7b,
  },
  break: {
    title: "Micro break",
    message: "Stand up, loosen your hands, and let your head reset for a minute.",
    badgeLabel: "BRK",
    accentColor: 0xead1a1,
    strokeColor: 0x6b4d14,
  },
  panic: {
    title: "Panic pause",
    message: "Breathe once. Then read the error like it is trying very hard to be helpful.",
    badgeLabel: "PAN",
    accentColor: 0xf1a7a7,
    strokeColor: 0x7b2f2f,
  },
};

export function getReminderContent(kind: ReminderKind) {
  return reminderContentMap[kind];
}
