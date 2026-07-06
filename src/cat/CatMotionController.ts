import type { CatState } from "./CatTypes";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export type CatMotionInput = {
  activeState: CatState;
  centerX: number;
  dragging: boolean;
  elapsed: number;
  deltaSeconds: number;
  facing: number;
  walking: boolean;
  walkTargetX: number;
  pointerX: number;
  pullX: number;
  pullY: number;
};

export type CatMotionOutput = {
  edgeIntensity: number;
  bob: number;
  idleSway: number;
  lookX: number;
  lookY: number;
  blink: number;
  rootX: number;
  rootY: number;
  rotation: number;
};

export class CatMotionController {
  private readonly seed = Math.random() * Math.PI * 2;
  private idleOffsetX = 0;
  private idleOffsetY = 0;
  private releaseOffsetX = 0;
  private releaseOffsetY = 0;
  private releaseVelocityX = 0;
  private releaseVelocityY = 0;
  private edgeOffsetX = 0;
  private edgeOffsetY = 0;
  private edgeVelocityX = 0;
  private edgeVelocityY = 0;
  private edgeIntensity = 0;
  private walkOffsetX = 0;
  private lookX = 0;
  private lookY = 0;
  private followOffsetX = 0;
  private blinkCooldown = 2.8 + Math.random() * 1.8;
  private blinkTimer = 0;
  private blinkHold = 0;
  private blinkPhase = 0;
  private blinkEase = 0;

  registerDragRelease(pullX: number, pullY: number) {
    this.releaseVelocityX += clamp(pullX * 0.03, -4.8, 4.8);
    this.releaseVelocityY += clamp(pullY * 0.02, -3.6, 3.6);
  }

  registerEdgeContact(contact: { bottom: boolean; left: boolean; right: boolean; top: boolean }) {
    const horizontal = contact.left ? 1 : contact.right ? -1 : 0;
    const vertical = contact.top ? 1 : contact.bottom ? -1 : 0;

    if (horizontal !== 0) {
      this.edgeVelocityX += horizontal * 2.2;
    }

    if (vertical !== 0) {
      this.edgeVelocityY += vertical * 1.8;
    }

    this.edgeIntensity = Math.min(1, this.edgeIntensity + 0.45);
  }

  update(input: CatMotionInput): CatMotionOutput {
    const orientation = input.facing >= 0 ? 1 : -1;
    const pointerDeltaX = input.pointerX - input.centerX;
    const pointerBias = clamp(pointerDeltaX / 260, -1, 1);
    const farSideBias = Math.abs(pointerDeltaX) > 160 ? Math.sign(pointerDeltaX) * 1.15 : 0;
    const lookTargetX = clamp(pointerDeltaX * 0.037, -10, 10);
    const lookTargetY = Math.sin(input.elapsed * 0.8 + this.seed) * 0.35;
    const lookBlend = input.dragging ? 0.2 : 0.08;
    const followTargetX =
      input.activeState === "sleeping" || input.activeState === "walking"
        ? 0
        : clamp(pointerDeltaX * 0.017 + pointerBias * 1.1 + farSideBias, -7.4, 7.4);
    const walkTargetX = input.walking ? clamp(input.walkTargetX, -8_000, 8_000) : 0;

    this.lookX += (lookTargetX - this.lookX) * lookBlend;
    this.lookY += (lookTargetY - this.lookY) * 0.06;
    this.followOffsetX += (followTargetX - this.followOffsetX) * (input.dragging ? 0.14 : 0.08);
    this.walkOffsetX += (walkTargetX - this.walkOffsetX) * (input.walking ? 0.09 : 0.05);

    if (input.dragging || input.activeState === "sleeping") {
      this.blinkPhase = 0;
      this.blinkTimer = 0;
      this.blinkEase += (0 - this.blinkEase) * 0.2;
    } else {
      this.blinkCooldown -= input.deltaSeconds;
      if (this.blinkPhase === 0 && this.blinkCooldown <= 0) {
        this.blinkPhase = 1;
        this.blinkTimer = 0;
        this.blinkHold = 0.08 + Math.random() * 0.05;
        this.blinkCooldown = 2.8 + Math.random() * 2.8;
      }

      if (this.blinkPhase !== 0) {
        this.blinkTimer += input.deltaSeconds;

        if (this.blinkPhase === 1) {
          this.blinkEase = clamp(this.blinkTimer / 0.08, 0, 1);
          if (this.blinkTimer >= 0.08) {
            this.blinkPhase = 2;
            this.blinkTimer = 0;
          }
        } else if (this.blinkPhase === 2) {
          this.blinkEase = 1;
          if (this.blinkTimer >= this.blinkHold) {
            this.blinkPhase = 3;
            this.blinkTimer = 0;
          }
        } else {
          this.blinkEase = 1 - clamp(this.blinkTimer / 0.14, 0, 1);
          if (this.blinkTimer >= 0.14) {
            this.blinkPhase = 0;
            this.blinkTimer = 0;
            this.blinkEase = 0;
          }
        }
      } else {
        this.blinkEase += (0 - this.blinkEase) * 0.18;
      }
    }

    const idleTargetX =
      input.activeState === "sleeping" || input.activeState === "walking"
        ? Math.sin(input.elapsed * 0.32 + this.seed) * 0.4
        : Math.sin(input.elapsed * 0.55 + this.seed) * 1.2 +
          Math.sin(input.elapsed * 1.9 + this.seed * 0.7) * 0.45;
    const idleTargetY =
      input.activeState === "sleeping" || input.activeState === "walking"
        ? Math.sin(input.elapsed * 0.42 + this.seed * 0.5) * 0.7
        : Math.sin(input.elapsed * 0.72 + this.seed * 0.8) * 0.55;

    const idleBlend = input.dragging ? 0.02 : 0.04;
    this.idleOffsetX += (idleTargetX - this.idleOffsetX) * idleBlend;
    this.idleOffsetY += (idleTargetY - this.idleOffsetY) * idleBlend;

    this.releaseOffsetX += this.releaseVelocityX;
    this.releaseOffsetY += this.releaseVelocityY;
    this.releaseVelocityX += -this.releaseOffsetX * 0.08;
    this.releaseVelocityY += -this.releaseOffsetY * 0.08;
    this.releaseVelocityX *= 0.86;
    this.releaseVelocityY *= 0.86;

    this.edgeOffsetX += this.edgeVelocityX;
    this.edgeOffsetY += this.edgeVelocityY;
    this.edgeVelocityX += -this.edgeOffsetX * 0.12;
    this.edgeVelocityY += -this.edgeOffsetY * 0.12;
    this.edgeVelocityX *= 0.78;
    this.edgeVelocityY *= 0.78;
    this.edgeIntensity *= 0.88;

    if (Math.abs(this.releaseOffsetX) < 0.02 && Math.abs(this.releaseVelocityX) < 0.02) {
      this.releaseOffsetX = 0;
      this.releaseVelocityX = 0;
    }

    if (Math.abs(this.releaseOffsetY) < 0.02 && Math.abs(this.releaseVelocityY) < 0.02) {
      this.releaseOffsetY = 0;
      this.releaseVelocityY = 0;
    }

    const bob =
      input.activeState === "sleeping"
        ? Math.sin(input.elapsed * 1.4 + this.seed) * 1.35
        : input.activeState === "walking"
          ? Math.sin(input.elapsed * 5.2 + this.seed) * 1.35
          : Math.sin(input.elapsed * 3.2 + this.seed) * 1.05;
    const idleSway =
      input.activeState === "sleeping"
        ? Math.sin(input.elapsed * 0.8 + this.seed) * 0.01
        : input.activeState === "walking"
          ? Math.sin(input.elapsed * 1.8 + this.seed) * 0.02 * orientation
          : Math.sin(input.elapsed * 1.1 + this.seed) * 0.014 * orientation;

    const rotation =
      clamp(input.pullX / 160, -0.16, 0.16) * 0.45 +
      this.releaseOffsetX * 0.01 +
      idleSway +
      this.edgeOffsetX * 0.004;

    return {
      edgeIntensity: this.edgeIntensity,
      bob,
      idleSway,
      lookX: this.lookX,
      lookY: this.lookY,
      blink: this.blinkEase,
      rootX:
        this.idleOffsetX +
        this.releaseOffsetX +
        this.edgeOffsetX +
        this.followOffsetX +
        this.walkOffsetX,
      rootY: this.idleOffsetY + this.releaseOffsetY + bob * 0.2 + this.edgeOffsetY,
      rotation,
    };
  }
}
