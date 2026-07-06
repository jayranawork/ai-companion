import type { CatAnimationDefinition, CatState } from "./CatTypes";

const animationMap: Record<CatState, CatAnimationDefinition> = {
  angry: { loop: true, name: "hurt", speed: 0.16 },
  curious: { loop: true, name: "idle", speed: 0.12 },
  dragging: { loop: true, name: "walk", speed: 0.14 },
  happy: { loop: true, name: "jump", speed: 0.18 },
  idle: { loop: true, name: "idle", speed: 0.1 },
  walking: { loop: true, name: "walk", speed: 0.08 },
  sleeping: { loop: true, name: "slide", speed: 0.08 },
  stretching: { loop: true, name: "run", speed: 0.16 },
};

export class CatAnimationController {
  getAnimationForState(state: CatState) {
    return animationMap[state];
  }
}
