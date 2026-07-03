import { getReminderContent } from "./CatReminderContent";
import type { CatReminder, CustomReminder, ReminderKind } from "./CatTypes";

const FOCUS_INTERVAL_SECONDS = 45 * 60;
const COFFEE_INTERVAL_SECONDS = 90 * 60;
const REMINDER_VISIBLE_SECONDS = 8;

export class CatReminderScheduler {
  private nextFocusAt = FOCUS_INTERVAL_SECONDS;
  private nextCoffeeAt = COFFEE_INTERVAL_SECONDS;
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
