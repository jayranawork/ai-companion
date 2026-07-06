import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { getReminderContent } from "./CatReminderContent";
import type { CatReminder, CatState } from "./CatTypes";

type OverlayLayout = {
  rootX: number;
  rootY: number;
  screenHeight: number;
  screenWidth: number;
};

export class CatOverlayRenderer {
  readonly container = new Container();
  private happyEmoji: Text;
  private sparkles: Graphics[] = [];
  private steamPuffs: Graphics[] = [];
  private sleepText: Text;
  private reminderBubble: Graphics;
  private reminderBadge: Graphics;
  private reminderBadgeText: Text;
  private reminderTitle: Text;
  private reminderText: Text;

  constructor() {
    for (let index = 0; index < 3; index += 1) {
      const sparkle = new Graphics()
        .star(0, 0, 4, 9 - index)
        .fill({ color: 0xf8e06b, alpha: 0.9 - index * 0.12 });
      sparkle.visible = false;
      this.sparkles.push(sparkle);
      this.container.addChild(sparkle);
    }

    for (let index = 0; index < 3; index += 1) {
      const steam = new Graphics()
        .ellipse(0, 0, 8 - index, 12 - index)
        .fill({ color: 0xe8f2f5, alpha: 0.48 - index * 0.08 });
      steam.visible = false;
      this.steamPuffs.push(steam);
      this.container.addChild(steam);
    }

    this.sleepText = new Text({
      text: "Zzz",
      style: new TextStyle({
        fill: 0xf8f4ec,
        fontFamily: "Segoe UI",
        fontSize: 18,
        fontStyle: "italic",
        fontWeight: "700",
      }),
    });
    this.sleepText.anchor.set(0.5);
    this.sleepText.visible = false;
    this.container.addChild(this.sleepText);

    this.happyEmoji = new Text({
      text: ":)",
      style: new TextStyle({
        fill: 0xf7d46b,
        fontFamily: "Segoe UI",
        fontSize: 18,
        fontWeight: "800",
      }),
    });
    this.happyEmoji.anchor.set(0.5);
    this.happyEmoji.visible = false;
    this.container.addChild(this.happyEmoji);

    this.reminderBubble = new Graphics();
    this.reminderBubble.visible = false;
    this.container.addChild(this.reminderBubble);

    this.reminderBadge = new Graphics();
    this.reminderBadge.visible = false;
    this.container.addChild(this.reminderBadge);

    this.reminderBadgeText = new Text({
      text: "",
      style: new TextStyle({
        fill: 0xffffff,
        fontFamily: "Segoe UI",
        fontSize: 10,
        fontWeight: "900",
        letterSpacing: 0.8,
      }),
    });
    this.reminderBadgeText.anchor.set(0.5);
    this.reminderBadgeText.visible = false;
    this.container.addChild(this.reminderBadgeText);

    this.reminderTitle = new Text({
      text: "",
      style: new TextStyle({
        fill: 0x2a2f36,
        fontFamily: "Segoe UI",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 0.4,
        align: "left",
      }),
    });
    this.reminderTitle.anchor.set(0, 0);
    this.reminderTitle.visible = false;
    this.container.addChild(this.reminderTitle);

    this.reminderText = new Text({
      text: "",
      style: new TextStyle({
        fill: 0x1a1d21,
        fontFamily: "Segoe UI",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 16,
        align: "left",
        wordWrap: true,
        wordWrapWidth: 160,
      }),
    });
    this.reminderText.anchor.set(0, 0);
    this.reminderText.visible = false;
    this.container.addChild(this.reminderText);
  }

  update(
    state: CatState,
    elapsed: number,
    facing: number,
    intensity: number,
    reminder: CatReminder | null,
    layout: OverlayLayout,
  ) {
    const sleepActive = state === "sleeping";
    const happyActive = state === "happy";
    const sparkleActive = happyActive || state === "stretching";
    const steamActive = state === "angry" || (state === "stretching" && intensity > 0.2);
    const side = facing >= 0 ? 1 : -1;

    this.sleepText.visible = sleepActive;
    if (sleepActive) {
      this.sleepText.position.set(20 * side, -82 + Math.sin(elapsed * 2.1) * 4);
      this.sleepText.alpha = 0.78 + Math.sin(elapsed * 2.3) * 0.12;
    }

    this.happyEmoji.visible = happyActive;
    if (happyActive) {
      this.happyEmoji.position.set(12 * side, -86 + Math.sin(elapsed * 5.2) * 4);
      this.happyEmoji.rotation = Math.sin(elapsed * 4.6) * 0.08;
      this.happyEmoji.scale.set(1 + Math.sin(elapsed * 6.4) * 0.06);
    }

    this.sparkles.forEach((sparkle, index) => {
      sparkle.visible = sparkleActive;
      if (!sparkleActive) {
        return;
      }

      const phase = elapsed * (2.8 + index * 0.4);
      sparkle.position.set(
        (24 + index * 13) * side,
        -44 - index * 8 + Math.sin(phase) * 5,
      );
      sparkle.rotation = phase;
      sparkle.scale.set(0.8 + Math.sin(phase) * 0.12);
    });

    this.steamPuffs.forEach((steam, index) => {
      steam.visible = steamActive;
      if (!steamActive) {
        return;
      }

      const drift = elapsed * (1.6 + index * 0.22);
      steam.position.set(
        (18 + index * 10) * side,
        -54 - index * 12 - Math.sin(drift) * 5,
      );
      steam.scale.set(0.9 + index * 0.08 + intensity * 0.4);
      steam.alpha = 0.28 + intensity * 0.34;
    });

    this.reminderBubble.visible = Boolean(reminder);
    this.reminderBadge.visible = Boolean(reminder);
    this.reminderBadgeText.visible = Boolean(reminder);
    this.reminderTitle.visible = Boolean(reminder);
    this.reminderText.visible = Boolean(reminder);

    if (reminder) {
      const content = getReminderContent(reminder.kind);
      this.reminderBadgeText.text = content.badgeLabel;
      this.reminderTitle.text = content.title;
      this.reminderText.text = reminder.message || content.message;
      const badgeWidth = 46;
      const badgeHeight = 20;
      const paddingX = 16;
      const paddingTop = 14;
      const paddingBottom = 16;
      const width = Math.max(236, Math.min(280, layout.screenWidth - 24));
      const innerWidth = width - paddingX * 2;
      const titleWidth = innerWidth - badgeWidth - 12;
      const headerHeight = 24;
      const contentTop = paddingTop + headerHeight + 10;
      this.reminderTitle.style.wordWrap = true;
      this.reminderTitle.style.wordWrapWidth = titleWidth;
      this.reminderText.style.wordWrap = true;
      this.reminderText.style.wordWrapWidth = innerWidth;
      this.reminderText.style.breakWords = true;
      this.reminderTitle.style.breakWords = true;
      const height = Math.max(
        94,
        contentTop + this.reminderText.height + paddingBottom,
      );
      const roomAbove = layout.rootY - 150;
      const roomBelow = layout.screenHeight - layout.rootY - 150;
      const preferBelow = roomAbove < height + 18 && roomBelow > roomAbove;
      const preferSide = roomAbove < height + 18 && roomBelow < height + 18;
      let bubbleX = 0;
      let bubbleY = -124 + Math.sin(elapsed * 1.6) * 1.4;
      let tailMode: "top" | "bottom" | "left" | "right" = "bottom";

      if (preferBelow) {
        bubbleY = 112 + Math.sin(elapsed * 1.6) * 1.4;
        tailMode = "top";
      } else if (preferSide) {
        const goRight = layout.rootX < layout.screenWidth / 2;
        bubbleX = goRight ? 124 : -124;
        bubbleY = -14 + Math.sin(elapsed * 1.6) * 1.2;
        tailMode = goRight ? "left" : "right";
      }
      const bubbleTop = bubbleY - height / 2;

      this.reminderBubble
        .clear()
        .roundRect(-width / 2, -height / 2, width, height, 19)
        .fill({ color: 0xf8f6ef, alpha: 0.97 })
        .stroke({ color: content.strokeColor, width: 1.8 });

      if (tailMode === "bottom") {
        this.reminderBubble
          .moveTo(-12, height / 2 - 2)
          .lineTo(0, height / 2 + 14)
          .lineTo(12, height / 2 - 2)
          .closePath()
          .fill({ color: 0xf8f6ef, alpha: 0.97 })
          .stroke({ color: content.strokeColor, width: 1.8 });
      } else if (tailMode === "top") {
        this.reminderBubble
          .moveTo(-12, -height / 2 + 2)
          .lineTo(0, -height / 2 - 14)
          .lineTo(12, -height / 2 + 2)
          .closePath()
          .fill({ color: 0xf8f6ef, alpha: 0.97 })
          .stroke({ color: content.strokeColor, width: 1.8 });
      } else if (tailMode === "left") {
        this.reminderBubble
          .moveTo(-width / 2 + 2, -10)
          .lineTo(-width / 2 - 14, 0)
          .lineTo(-width / 2 + 2, 10)
          .closePath()
          .fill({ color: 0xf8f6ef, alpha: 0.97 })
          .stroke({ color: content.strokeColor, width: 1.8 });
      } else {
        this.reminderBubble
          .moveTo(width / 2 - 2, -10)
          .lineTo(width / 2 + 14, 0)
          .lineTo(width / 2 - 2, 10)
          .closePath()
          .fill({ color: 0xf8f6ef, alpha: 0.97 })
          .stroke({ color: content.strokeColor, width: 1.8 });
      }

      this.reminderBubble.position.set(bubbleX, bubbleY);
      this.reminderBadge
        .clear()
        .roundRect(0, 0, badgeWidth, badgeHeight, 10)
        .fill({ color: content.accentColor, alpha: 1 })
        .stroke({ color: content.strokeColor, width: 1.5 });
      this.reminderBadge.position.set(
        -width / 2 + paddingX,
        bubbleTop + paddingTop + 1,
      );
      this.reminderBadgeText.position.set(
        -width / 2 + paddingX + badgeWidth / 2,
        bubbleTop + paddingTop + badgeHeight / 2 + 1,
      );
      this.reminderTitle.position.set(
        -width / 2 + paddingX + badgeWidth + 10,
        bubbleTop + paddingTop + 2,
      );
      this.reminderText.position.set(
        -width / 2 + paddingX,
        bubbleTop + contentTop,
      );
      this.reminderTitle.style.fill = content.accentColor;
      this.reminderText.style.fill = content.strokeColor;
      this.reminderText.scale.set(1, 1);
    }
  }
}
