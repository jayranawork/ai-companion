import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatedSprite,
  Application,
  Assets,
  Container,
  FederatedPointerEvent,
  Graphics,
  Point,
  Rectangle,
} from "pixi.js";
import { CatAnimationController } from "./CatAnimationController";
import { CatAssetLoader } from "./CatAssetLoader";
import { catEvents } from "./CatEvents";
import { CatOverlayRenderer } from "./CatOverlayRenderer";
import { CatPropController } from "./CatPropController";
import { getReminderContent, reminderKindOptions } from "./CatReminderContent";
import { CatReminderScheduler } from "./CatReminderScheduler";
import { CatStateMachine } from "./CatStateMachine";
import type { CatReminder, CatState, CustomReminder } from "./CatTypes";

const REMINDER_STORAGE_KEY = "desktop-dev-cat.custom-reminders";
const smokeExplosionModules = import.meta.glob("../assets/effects/smoke-explosion/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function parseFrameNumber(path: string) {
  const match = path.match(/_(\d+)\.png$/i);
  return match ? Number(match[1]) : 0;
}

function loadSmokeExplosionUrls() {
  return Object.entries(smokeExplosionModules)
    .sort(([left], [right]) => parseFrameNumber(left) - parseFrameNumber(right))
    .map(([, url]) => url);
}

function loadStoredReminders(): CustomReminder[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(REMINDER_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CustomReminder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type RendererControls = {
  showReminder: (reminder: CatReminder) => void;
  triggerMood: (state: Extract<CatState, "happy" | "angry">) => void;
};

export function CatRenderer() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<RendererControls | null>(null);
  const remindersRef = useRef<CustomReminder[]>([]);
  const tapCountRef = useRef(0);
  const secretTapResetRef = useRef<number | null>(null);
  const launcherHideRef = useRef<number | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [launcherVisible, setLauncherVisible] = useState(false);
  const [customReminders, setCustomReminders] = useState<CustomReminder[]>(() =>
    loadStoredReminders(),
  );
  const [newReminderTime, setNewReminderTime] = useState("15:00");
  const [newReminderMessage, setNewReminderMessage] = useState(
    getReminderContent("focus").message,
  );
  const [newReminderKind, setNewReminderKind] =
    useState<(typeof reminderKindOptions)[number]["value"]>("focus");
  const selectedReminderOption = reminderKindOptions.find(
    (option) => option.value === newReminderKind,
  );

  useEffect(() => {
    remindersRef.current = customReminders;
    window.localStorage.setItem(
      REMINDER_STORAGE_KEY,
      JSON.stringify(customReminders),
    );
  }, [customReminders]);

  useEffect(() => {
    if (panelOpen) {
      setLauncherVisible(true);
      if (launcherHideRef.current !== null) {
        window.clearTimeout(launcherHideRef.current);
        launcherHideRef.current = null;
      }
      return;
    }

    if (!launcherVisible) {
      return;
    }

    launcherHideRef.current = window.setTimeout(() => {
      setLauncherVisible(false);
      launcherHideRef.current = null;
    }, 10000);

    return () => {
      if (launcherHideRef.current !== null) {
        window.clearTimeout(launcherHideRef.current);
        launcherHideRef.current = null;
      }
    };
  }, [launcherVisible, panelOpen]);

  useEffect(() => {
    const hostNode = hostRef.current;

    if (!hostNode) {
      return;
    }

    const hostElement: HTMLDivElement = hostNode;

    let destroyed = false;
    let app: Application | null = null;

    async function setupScene() {
      const pixiApp = new Application();
      await pixiApp.init({
        resizeTo: hostElement,
        backgroundAlpha: 0,
        antialias: true,
      });

      const assetLoader = new CatAssetLoader();
      const animationController = new CatAnimationController();
      const reminderScheduler = new CatReminderScheduler();
      const stateMachine = new CatStateMachine();
      const animations = await assetLoader.load();

      if (destroyed) {
        pixiApp.destroy(true);
        return;
      }

      const smokeFrames = await Promise.all(
        loadSmokeExplosionUrls().map((url) => Assets.load(url)),
      );

      app = pixiApp;
      hostElement.appendChild(pixiApp.canvas);
      catEvents.emit("CAT_ASSETS_READY", undefined);

      const centerX = pixiApp.screen.width / 2;
      const centerY = pixiApp.screen.height / 2 - 8;
      const pointer = new Point(centerX, centerY);

      pixiApp.stage.eventMode = "static";
      pixiApp.stage.hitArea = new Rectangle(
        0,
        0,
        pixiApp.screen.width,
        pixiApp.screen.height,
      );

      const catRoot = new Container();
      catRoot.position.set(centerX, centerY);
      catRoot.eventMode = "static";
      catRoot.cursor = "grab";
      catRoot.hitArea = new Rectangle(-90, -120, 180, 240);

      const shadow = new Graphics()
        .ellipse(0, 92, 42, 10)
        .fill({ color: 0x000000, alpha: 0.12 });

      const animatedCat = new AnimatedSprite(animations.idle);
      animatedCat.anchor.set(0.5, 0.86);
      animatedCat.animationSpeed = 0.1;
      animatedCat.loop = true;
      animatedCat.roundPixels = true;
      animatedCat.scale.set(0.24);
      animatedCat.play();

      const propController = new CatPropController();
      const overlayRenderer = new CatOverlayRenderer();
      const edgeBurst = new AnimatedSprite(smokeFrames);
      edgeBurst.anchor.set(0.5);
      edgeBurst.visible = false;
      edgeBurst.loop = false;
      edgeBurst.animationSpeed = 0.45;
      edgeBurst.scale.set(0.2);
      edgeBurst.onComplete = () => {
        edgeBurst.visible = false;
        edgeBurst.stop();
      };

      catRoot.addChild(
        shadow,
        edgeBurst,
        animatedCat,
        propController.container,
        overlayRenderer.container,
      );
      pixiApp.stage.addChild(catRoot);

      let activeState: CatState = "idle";
      let activeFacing = 1;
      let activeReminder: CatReminder | null = null;
      let manualMood: { state: Extract<CatState, "happy" | "angry">; until: number } | null =
        null;
      let manualReminder: { reminder: CatReminder; until: number } | null = null;
      let dragging = false;
      let elapsed = 0;
      let stretch = 0;
      let stretchTarget = 0;
      let squash = 0;
      let squashTarget = 0;
      let wobble = 0;
      let idleTime = 0;
      let edgeBurstCooldown = 0;
      const grabScreenPoint = new Point(0, 0);
      const pullVector = new Point(0, 0);

      const triggerEdgeBurst = (x: number, y: number) => {
        edgeBurstCooldown = 0.35;
        edgeBurst.visible = true;
        edgeBurst.position.set(x, y);
        edgeBurst.gotoAndPlay(0);
      };

      controlsRef.current = {
        showReminder(reminder) {
          manualReminder = { reminder, until: elapsed + 8 };
        },
        triggerMood(state) {
          manualMood = { state, until: elapsed + 5 };
        },
      };

      const applyState = (state: CatState) => {
        if (state === activeState) {
          return;
        }

        if (!stateMachine.transition(state)) {
          if (stateMachine.getState() === "sleeping" && state !== "idle") {
            stateMachine.transition("idle");
            activeState = "idle";
          }

          if (!stateMachine.transition(state)) {
            return;
          }
        }

        activeState = state;
        const animation = animationController.getAnimationForState(state);
        animatedCat.textures = animations[animation.name];
        animatedCat.animationSpeed = animation.speed;
        animatedCat.loop = animation.loop;
        animatedCat.gotoAndPlay(0);
      };

      const handlePointerMove = (event: FederatedPointerEvent) => {
        pointer.copyFrom(event.global);
        idleTime = 0;

        if (!dragging) {
          const dx = event.global.x - catRoot.x;
          const dy = event.global.y - catRoot.y;
          const isNear = Math.sqrt(dx * dx + dy * dy) < 110;
          applyState(isNear ? "curious" : "idle");
          return;
        }

        pullVector.set(
          clamp(event.screen.x - grabScreenPoint.x, -150, 150),
          clamp(event.screen.y - grabScreenPoint.y, -170, 170),
        );
        const distance = Math.sqrt(
          pullVector.x * pullVector.x + pullVector.y * pullVector.y,
        );
        stretchTarget = clamp(distance / 180, 0, 0.5);
        squashTarget = clamp(Math.abs(pullVector.y) / 220, 0.02, 0.12);
        applyState(distance > 70 ? "stretching" : "dragging");

        if (
          edgeBurstCooldown <= 0 &&
          (Math.abs(pullVector.x) >= 148 || Math.abs(pullVector.y) >= 168)
        ) {
          triggerEdgeBurst(
            clamp(pullVector.x * 0.26, -42, 42),
            clamp(pullVector.y * 0.24, -32, 54),
          );
        }
      };

      const handlePointerUp = () => {
        if (!dragging) {
          return;
        }

        dragging = false;
        catRoot.cursor = "grab";
        stretchTarget = 0;
        squashTarget = 0;
        wobble = pullVector.x > 0 ? 0.14 : -0.14;
        pullVector.set(0, 0);
        window.desktopDevCat.endWindowDrag();
        applyState("idle");
        catEvents.emit("CAT_DRAG_END", undefined);
      };

      catRoot.on("pointerdown", (event: FederatedPointerEvent) => {
        dragging = true;
        catRoot.cursor = "grabbing";
        grabScreenPoint.set(event.screen.x, event.screen.y);
        stretchTarget = 0.05;
        squashTarget = 0.04;
        pullVector.set(0, 0);
        window.desktopDevCat.startWindowDrag(event.screen.x, event.screen.y);
        applyState("dragging");
        catEvents.emit("CAT_DRAG_START", undefined);
      });

      catRoot.on("pointertap", () => {
        tapCountRef.current += 1;

        if (secretTapResetRef.current !== null) {
          window.clearTimeout(secretTapResetRef.current);
        }

        secretTapResetRef.current = window.setTimeout(() => {
          tapCountRef.current = 0;
          secretTapResetRef.current = null;
        }, 1200);

        if (tapCountRef.current === 3) {
          controlsRef.current?.triggerMood("happy");
        }

        if (tapCountRef.current >= 8) {
          tapCountRef.current = 0;
          setLauncherVisible(true);
          if (secretTapResetRef.current !== null) {
            window.clearTimeout(secretTapResetRef.current);
            secretTapResetRef.current = null;
          }
        }
      });

      pixiApp.stage.on("pointermove", handlePointerMove);
      pixiApp.stage.on("pointerup", handlePointerUp);
      pixiApp.stage.on("pointerupoutside", handlePointerUp);

      pixiApp.ticker.add((ticker) => {
        const deltaSeconds = ticker.deltaMS / 1000;
        elapsed += deltaSeconds;
        idleTime += deltaSeconds;

        if (manualMood && elapsed >= manualMood.until) {
          manualMood = null;
        }

        if (manualReminder && elapsed >= manualReminder.until) {
          manualReminder = null;
        }

        edgeBurstCooldown = Math.max(0, edgeBurstCooldown - deltaSeconds);

        if (!dragging && idleTime > 30 && !manualMood) {
          applyState("sleeping");
        }

        const nextReminder = reminderScheduler.update(elapsed, remindersRef.current);
        if (nextReminder && nextReminder !== activeReminder) {
          catEvents.emit("CAT_REMINDER", nextReminder);
        }
        activeReminder = manualReminder?.reminder ?? nextReminder;

        if (manualMood) {
          applyState(manualMood.state);
        }

        stretch += (stretchTarget - stretch) * (dragging ? 0.2 : 0.1);
        squash += (squashTarget - squash) * (dragging ? 0.16 : 0.08);
        wobble *= dragging ? 0.88 : 0.92;

        const lookX = clamp((pointer.x - centerX) * 0.03, -8, 8);
        const idleBreath = !dragging && activeState !== "sleeping" ? Math.sin(elapsed * 2) * 0.008 : 0;
        const idleSway = !dragging && activeState !== "sleeping" ? Math.sin(elapsed * 1.4) * 0.014 : 0;
        const bob = activeState === "sleeping" ? Math.sin(elapsed * 1.4) * 1.2 : Math.sin(elapsed * 3.2) * 1.4;
        const lean = clamp(pullVector.x / 160, -0.16, 0.16);
        const targetFacing = dragging
          ? pullVector.x < -8
            ? -1
            : pullVector.x > 8
              ? 1
              : activeFacing
          : lookX < -2
            ? -1
            : lookX > 2
              ? 1
              : activeFacing;

        activeFacing = targetFacing;

        shadow.scale.x = 1 - stretch * 0.12;
        shadow.scale.y = 1 - stretch * 0.18 - squash * 0.35;

        animatedCat.x = lookX + pullVector.x * 0.04;
        animatedCat.y = bob + stretch * 6 + squash * 6;
        animatedCat.rotation = lean * 0.3 + wobble * 0.35 + idleSway;
        animatedCat.scale.set(
          (0.24 - stretch * 0.01 + squash * 0.018) * activeFacing,
          0.24 + stretch * 0.016 - squash * 0.006 + idleBreath,
        );

        propController.update(false, elapsed, activeFacing);
        overlayRenderer.update(
          activeState,
          elapsed,
          activeFacing,
          stretch,
          activeReminder,
        );
      });
    }

    void setupScene();

    return () => {
      destroyed = true;
      controlsRef.current = null;
      window.desktopDevCat.endWindowDrag();

      if (secretTapResetRef.current !== null) {
        window.clearTimeout(secretTapResetRef.current);
      }

      if (launcherHideRef.current !== null) {
        window.clearTimeout(launcherHideRef.current);
      }

      if (app) {
        app.destroy(true);
      }

      hostElement.replaceChildren();
    };
  }, []);

  const sortedReminders = useMemo(
    () => [...customReminders].sort((left, right) => left.time.localeCompare(right.time)),
    [customReminders],
  );

  const addReminder = () => {
    if (!newReminderTime || !newReminderMessage.trim()) {
      return;
    }

    setCustomReminders((current) => [
      ...current,
      {
        enabled: true,
        id: crypto.randomUUID(),
        kind: newReminderKind,
        message: newReminderMessage.trim(),
        time: newReminderTime,
      },
    ]);
  };

  const removeReminder = (id: string) => {
    setCustomReminders((current) => current.filter((reminder) => reminder.id !== id));
  };

  const toggleReminder = (id: string) => {
    setCustomReminders((current) =>
      current.map((reminder) =>
        reminder.id === id
          ? { ...reminder, enabled: !reminder.enabled }
          : reminder,
      ),
    );
  };

  return (
    <main className="cat-scene">
      <div className="cat-scene__canvas" ref={hostRef} />

      {launcherVisible ? (
        <button
          className="cat-panel-toggle"
          type="button"
          aria-label={panelOpen ? "Close reminders panel" : "Open reminders panel"}
          onClick={() => setPanelOpen((open) => !open)}
        >
          <span aria-hidden="true">+</span>
        </button>
      ) : null}

      {panelOpen ? (
        <aside className="cat-panel">
          <div className="cat-panel__header">
            <div>
              <h2>Developer Reminders</h2>
              <p>Schedule quiet nudges that fit a coding session.</p>
            </div>
            <button
              className="cat-panel__close"
              type="button"
              aria-label="Close reminders panel"
              onClick={() => setPanelOpen(false)}
            >
              x
            </button>
          </div>

          <label className="cat-panel__field">
            <span>Time</span>
            <input
              type="time"
              value={newReminderTime}
              onChange={(event) => setNewReminderTime(event.target.value)}
            />
          </label>

          <label className="cat-panel__field">
            <span>Reminder</span>
            <select
              value={newReminderKind}
              onChange={(event) =>
                setNewReminderKind(event.target.value as (typeof reminderKindOptions)[number]["value"])
              }
            >
              {reminderKindOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="cat-panel__hint">
              {selectedReminderOption?.description ?? "Choose the tone of the nudge."}
            </p>
          </label>

          <label className="cat-panel__field">
            <span>Message</span>
            <input
              type="text"
              value={newReminderMessage}
              onChange={(event) => setNewReminderMessage(event.target.value)}
              placeholder={getReminderContent(newReminderKind).message}
            />
          </label>

          <button className="cat-panel__primary" type="button" onClick={addReminder}>
            Add Reminder
          </button>

          <div className="cat-panel__demo">
            <button type="button" onClick={() => controlsRef.current?.triggerMood("happy")}>
              Test Sparkles
            </button>
            <button type="button" onClick={() => controlsRef.current?.triggerMood("angry")}>
              Test Steam
            </button>
            <button
              type="button"
              onClick={() =>
                controlsRef.current?.showReminder({
                  kind: "focus",
                  message: getReminderContent("focus").message,
                })
              }
            >
              Test Popup
            </button>
          </div>

          <div className="cat-panel__list">
            {sortedReminders.length === 0 ? (
              <p className="cat-panel__empty">No custom reminders yet.</p>
            ) : (
              sortedReminders.map((reminder) => (
                <div className="cat-panel__item" key={reminder.id}>
                  <div>
                    <strong>{reminder.time}</strong>
                    <span>{getReminderContent(reminder.kind).title}</span>
                    <p>{reminder.message}</p>
                  </div>
                  <div className="cat-panel__actions">
                    <button type="button" onClick={() => toggleReminder(reminder.id)}>
                      {reminder.enabled ? "Disable" : "Enable"}
                    </button>
                    <button type="button" onClick={() => removeReminder(reminder.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      ) : null}
    </main>
  );
}
