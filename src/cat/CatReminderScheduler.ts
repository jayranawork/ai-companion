import { getReminderContent } from "./CatReminderContent";
import type { CatReminder, CustomReminder, ReminderKind } from "./CatTypes";

const FOCUS_INTERVAL_SECONDS = 45 * 60;
const COFFEE_INTERVAL_SECONDS = 90 * 60;
const SURPRISE_REMINDER_MIN_SECONDS = 14 * 60;
const SURPRISE_REMINDER_MAX_SECONDS = 31 * 60;
const REMINDER_VISIBLE_SECONDS = 8;
const surpriseReminderKinds: ReminderKind[] = [
  "lint",
  "refactor",
  "test",
  "push",
  "logs",
  "break",
  "panic",
  "debug",
  "build",
  "git",
];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export class CatReminderScheduler {
  private nextFocusAt = FOCUS_INTERVAL_SECONDS;
  private nextCoffeeAt = COFFEE_INTERVAL_SECONDS;
  private nextSurpriseAt = randomBetween(SURPRISE_REMINDER_MIN_SECONDS, SURPRISE_REMINDER_MAX_SECONDS);
  private activeReminder: CatReminder | null = null;
  private activeUntil = 0;
  private customTriggerMap = new Map<string, string>();

  private createReminder(kind: ReminderKind): CatReminder {
    const content = getReminderContent(kind);

    return {
      kind,
      message: content.message,
    };
  }

  private createSurpriseReminder(): CatReminder {
    const kind = surpriseReminderKinds[Math.floor(Math.random() * surpriseReminderKinds.length)];
    const content = getReminderContent(kind);

    const funByKind: Partial<Record<ReminderKind, string[]>> = {
      lint: [
        "The lint dragon is asking for one more tiny cleanup.",
        "A quick lint pass could save future-you from a mysterious sigh.",
      ],
      refactor: [
        "A little refactor now might save a dramatic refactor later.",
        "The code is whispering that this part wants to be less messy.",
      ],
      test: [
        "The tests want attention before the branch gets too comfortable.",
        "Run the test suite and let reality do a quick quality check.",
      ],
      push: [
        "This branch has been a houseguest long enough. Time to push it out.",
        "Your code is ready to meet the rest of the team.",
      ],
      logs: [
        "The logs are still talking. Catch the useful line before it disappears.",
        "Something in the logs probably knows the answer already.",
      ],
      break: [
        "Stand up, blink, and let your shoulders stop being dramatic.",
        "A micro break now is cheaper than a grumpy back later.",
      ],
      panic: [
        "Take one breath. Then we can absolutely deal with the bug.",
        "The cat believes in you. The bug is not as strong as it looks.",
      ],
      debug: [
        "Debugger mode: on. Tiny mystery, slightly less tiny patience.",
        "One more calm look at the error and the shape usually appears.",
      ],
      build: [
        "Run the build. If it complains, at least it is being honest.",
        "Time to let the pipeline have a say.",
      ],
      git: [
        "Commit the good bit before your brain opens five new tabs.",
        "The code deserves a checkpoint while the idea is still warm.",
      ],
    };

    const pool = funByKind[kind] ?? [content.message];
    const message = pool[Math.floor(Math.random() * pool.length)] ?? content.message;

    return {
      kind,
      message,
    };
  }

  update(elapsedSeconds: number, customReminders: CustomReminder[]) {
    if (this.activeReminder && elapsedSeconds >= this.activeUntil) {
      this.activeReminder = null;
    }

    if (elapsedSeconds >= this.nextFocusAt) {
      this.activeReminder = this.createReminder("focus");
      this.activeUntil = elapsedSeconds + REMINDER_VISIBLE_SECONDS;
      this.nextFocusAt += FOCUS_INTERVAL_SECONDS;
      return this.activeReminder;
    }

    if (elapsedSeconds >= this.nextCoffeeAt) {
      this.activeReminder = this.createReminder("coffee");
      this.activeUntil = elapsedSeconds + REMINDER_VISIBLE_SECONDS;
      this.nextCoffeeAt += COFFEE_INTERVAL_SECONDS;
      return this.activeReminder;
    }

    if (elapsedSeconds >= this.nextSurpriseAt) {
      this.activeReminder = this.createSurpriseReminder();
      this.activeUntil = elapsedSeconds + REMINDER_VISIBLE_SECONDS;
      this.nextSurpriseAt =
        elapsedSeconds + randomBetween(SURPRISE_REMINDER_MIN_SECONDS, SURPRISE_REMINDER_MAX_SECONDS);
      return this.activeReminder;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;
    const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    for (const reminder of customReminders) {
      if (!reminder.enabled || reminder.time !== currentTime) {
        continue;
      }

      const triggerKey = `${todayKey}:${reminder.id}:${currentTime}`;
      if (this.customTriggerMap.get(reminder.id) === triggerKey) {
        continue;
      }

      this.customTriggerMap.set(reminder.id, triggerKey);
      this.activeReminder = {
        kind: reminder.kind,
        message: reminder.message,
      };
      this.activeUntil = elapsedSeconds + REMINDER_VISIBLE_SECONDS;
      return this.activeReminder;
    }

    return this.activeReminder;
  }
}
