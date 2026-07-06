import { catEvents } from "./CatEvents";
import type { CatState } from "./CatTypes";

const allowedTransitions: Record<CatState, CatState[]> = {
  angry: ["idle"],
  curious: ["idle", "dragging", "walking", "happy", "angry", "sleeping"],
  dragging: ["stretching", "idle"],
  happy: ["idle"],
  idle: ["curious", "dragging", "walking", "sleeping", "happy", "angry"],
  sleeping: ["idle"],
  stretching: ["idle", "dragging", "walking"],
  walking: ["idle", "curious", "dragging", "sleeping"],
};

export class CatStateMachine {
  private currentState: CatState = "idle";

  getState() {
    return this.currentState;
  }

  transition(nextState: CatState) {
    if (nextState === this.currentState) {
      return true;
    }

    const allowed = allowedTransitions[this.currentState];

    if (!allowed.includes(nextState)) {
      return false;
    }

    const previous = this.currentState;
    this.currentState = nextState;
    catEvents.emit("CAT_STATE_CHANGE", { next: nextState, previous });
    return true;
  }
}
