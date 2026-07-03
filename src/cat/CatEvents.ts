import type { CatEventName, CatReminder, CatState } from "./CatTypes";

type EventPayloads = {
  CAT_ASSETS_READY: undefined;
  CAT_DRAG_END: undefined;
  CAT_DRAG_START: undefined;
  CAT_REMINDER: CatReminder;
  CAT_STATE_CHANGE: { next: CatState; previous: CatState };
};

type EventHandler<T extends CatEventName> = (payload: EventPayloads[T]) => void;

class CatEventBus {
  private listeners = new Map<CatEventName, Set<EventHandler<CatEventName>>>();

  emit<T extends CatEventName>(event: T, payload: EventPayloads[T]) {
    const handlers = this.listeners.get(event);

    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => {
      (handler as EventHandler<T>)(payload);
    });
  }

  on<T extends CatEventName>(event: T, handler: EventHandler<T>) {
    const handlers = this.listeners.get(event) ?? new Set();
    handlers.add(handler as EventHandler<CatEventName>);
    this.listeners.set(event, handlers);

    return () => {
      handlers.delete(handler as EventHandler<CatEventName>);
    };
  }
}

export const catEvents = new CatEventBus();
