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
import { CatMotionController } from "./CatMotionController";
import { CatOverlayRenderer } from "./CatOverlayRenderer";
import { CatPropController } from "./CatPropController";
import { getReminderContent, reminderKindOptions } from "./CatReminderContent";
import { CatReminderScheduler } from "./CatReminderScheduler";
import { CatStateMachine } from "./CatStateMachine";
import type { AppSettings } from "../shared/appSettings";
import type { AppDevSignal } from "../shared/devSignal";
import type { AppRuntimeInfo } from "../shared/appRuntimeInfo";
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

function inferReminderKindFromSignal(signal: AppDevSignal): CatReminder["kind"] {
  if (signal.source === "build") {
    return signal.status === "error" ? "debug" : "build";
  }

  const command = signal.command ?? "";

  if (/(git|commit|push|pull|merge|rebase|checkout|branch)/i.test(command)) {
    return "git";
  }

  if (/(build|compile|tsc|vite build|webpack|rollup|cargo build|go build|test|jest|vitest|pytest|npm test)/i.test(command)) {
    return signal.status === "error" ? "debug" : "build";
  }

  return "debug";
}

type RendererControls = {
  showReminder: (reminder: CatReminder) => void;
  triggerMood: (state: Extract<CatState, "happy" | "angry">) => void;
};

type PanelTab = "reminders" | "controls";
type PanelSide = "left" | "right";

export function CatRenderer() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const launcherRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const controlsRef = useRef<RendererControls | null>(null);
  const remindersRef = useRef<CustomReminder[]>([]);
  const tapCountRef = useRef(0);
  const secretTapResetRef = useRef<number | null>(null);
  const launcherHideRef = useRef<number | null>(null);
  const appSettingsRef = useRef<AppSettings | null>(null);
  const catPositionRef = useRef({ x: 0, centerX: 0 });
  const launcherSideRef = useRef<PanelSide>("right");
  const sessionSecondsRef = useRef(0);
  const longSessionNudgeShownRef = useRef(false);
  const roamModeRef = useRef(false);
  const roamFacingRef = useRef<1 | -1>(1);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>("reminders");
  const [launcherSide, setLauncherSide] = useState<PanelSide>("right");
  const [panelSide, setPanelSide] = useState<PanelSide>("left");
  const [launcherVisible, setLauncherVisible] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [devSignal, setDevSignal] = useState<AppDevSignal | null>(null);
  const [runtimeInfo, setRuntimeInfo] = useState<AppRuntimeInfo | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [longSessionNudgeShown, setLongSessionNudgeShown] = useState(false);
  const [roamMode, setRoamMode] = useState(false);
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

  const updateAppSettings = async (patch: Partial<AppSettings>) => {
    const nextSettings = await window.desktopDevCat.setAppSettings(patch);
    setAppSettings(nextSettings);
    appSettingsRef.current = nextSettings;
  };

  const setPreferredLauncherSide = (side: PanelSide) => {
    launcherSideRef.current = side;
    setLauncherSide(side);
    setPanelSide(side === "left" ? "right" : "left");
  };

  const openPanel = (tab: PanelTab) => {
    setPreferredLauncherSide(launcherSideRef.current);
    setPanelTab(tab);
    setPanelOpen(true);
  };

  const toggleRoamMode = () => {
    setRoamMode((value) => {
      const next = !value;
      if (next) {
        setPanelOpen(false);
      }
      return next;
    });
  };

  const handleScenePointerDownCapture = (event: React.PointerEvent<HTMLElement>) => {
    if (!panelOpen) {
      return;
    }

    const target = event.target as Node | null;

    if (!target) {
      return;
    }

    if (panelRef.current?.contains(target) || launcherRef.current?.contains(target)) {
      return;
    }

    setPanelOpen(false);
  };

  useEffect(() => {
    remindersRef.current = customReminders;
    window.localStorage.setItem(
      REMINDER_STORAGE_KEY,
      JSON.stringify(customReminders),
    );
  }, [customReminders]);

  useEffect(() => {
    let active = true;

    void window.desktopDevCat.getRuntimeInfo().then((info) => {
      if (active) {
        setRuntimeInfo(info);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
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
  }, [launcherVisible]);

  useEffect(() => {
    sessionSecondsRef.current = 0;
    setSessionSeconds(0);
    longSessionNudgeShownRef.current = false;
    setLongSessionNudgeShown(false);
  }, []);

  useEffect(() => {
    roamModeRef.current = roamMode;
  }, [roamMode]);

  useEffect(() => {
    void window.desktopDevCat.setWindowRoam(roamMode);
  }, [roamMode]);

  useEffect(() => {
    const removeListener = window.desktopDevCat.onWindowRoamDirectionChanged((direction) => {
      roamFacingRef.current = direction >= 0 ? 1 : -1;
    });

    return () => {
      removeListener();
    };
  }, []);

  useEffect(() => {
    const removeListener = window.desktopDevCat.onWindowRoamStateChanged((roaming) => {
      setRoamMode(roaming);
    });

    return () => {
      removeListener();
    };
  }, []);

  useEffect(() => {
    let active = true;

    void window.desktopDevCat.getDevSignal().then((signal) => {
      if (active) {
        setDevSignal(signal);
      }
    });

    const removeListener = window.desktopDevCat.onDevSignalChanged((signal) => {
      setDevSignal(signal);
    });

    return () => {
      active = false;
      removeListener();
    };
  }, []);

  useEffect(() => {
    if (!devSignal) {
      return;
    }

    if (devSignal.status === "ready") {
      controlsRef.current?.triggerMood("happy");
      return;
    }

    if (devSignal.status === "error") {
      controlsRef.current?.triggerMood("angry");
      return;
    }

    if (devSignal.status === "compiling" || devSignal.status === "restarting") {
      controlsRef.current?.showReminder({
        kind: inferReminderKindFromSignal(devSignal),
        message: devSignal.message,
      });
    }
  }, [devSignal]);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (!target) {
        return;
      }

      if (panelRef.current?.contains(target) || launcherRef.current?.contains(target)) {
        return;
      }

      setPanelOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [panelOpen]);

  useEffect(() => {
    const hostNode = hostRef.current;

    if (!hostNode) {
      return;
    }

    const hostElement: HTMLDivElement = hostNode;

    let destroyed = false;
    let app: Application | null = null;
    let removeEdgeContactListener: (() => void) | null = null;
    let removeSettingsListener: (() => void) | null = null;
    let removeRoamStateListener: (() => void) | null = null;

    async function setupScene() {
      const pixiApp = new Application();
      await pixiApp.init({
        resizeTo: hostElement,
        backgroundAlpha: 0,
        antialias: true,
      });

      const assetLoader = new CatAssetLoader();
      const animationController = new CatAnimationController();
      const motionController = new CatMotionController();
      const reminderScheduler = new CatReminderScheduler();
      const stateMachine = new CatStateMachine();
      const animations = await assetLoader.load();
      const initialSettings = await window.desktopDevCat.getAppSettings();

      setAppSettings(initialSettings);
      appSettingsRef.current = initialSettings;

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
      catPositionRef.current = { x: centerX, centerX };

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
      let manualMood: { state: Extract<CatState, "happy" | "angry">; until: number } | null = null;
      let manualReminder: { reminder: CatReminder; until: number } | null = null;
      let dragging = false;
      let elapsed = 0;
      let stretch = 0;
      let stretchTarget = 0;
      let squash = 0;
      let squashTarget = 0;
      let wobble = 0;
      let sleepDeadline = 30;
      let edgeBurstCooldown = 0;
      const grabScreenPoint = new Point(0, 0);
      const pullVector = new Point(0, 0);

      const nudgeSleepTimer = () => {
        sleepDeadline = elapsed + 30;
      };

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

      removeSettingsListener = window.desktopDevCat.onAppSettingsChanged((settings) => {
        appSettingsRef.current = settings;
        setAppSettings(settings);
      });

      removeRoamStateListener = window.desktopDevCat.onWindowRoamStateChanged((roaming) => {
        roamModeRef.current = roaming;
        setRoamMode(roaming);

        if (!roaming && !dragging && activeState === "walking") {
          applyState("idle");
        }
      });

      removeEdgeContactListener = window.desktopDevCat.onWindowDragEdge((contact) => {
        motionController.registerEdgeContact(contact);
        if (contact.left) {
          setPreferredLauncherSide("right");
        } else if (contact.right) {
          setPreferredLauncherSide("left");
        }

        triggerEdgeBurst(
          contact.left ? 28 : contact.right ? -28 : 0,
          contact.top ? -26 : contact.bottom ? 28 : 0,
        );
      });

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
        nudgeSleepTimer();

        if (roamModeRef.current && !dragging) {
          return;
        }

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
        motionController.registerDragRelease(pullVector.x, pullVector.y);
        pullVector.set(0, 0);
        nudgeSleepTimer();
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
        nudgeSleepTimer();
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
          manualMood = { state: "happy", until: elapsed + 5 };
          nudgeSleepTimer();
        }

        if (tapCountRef.current >= 8) {
          tapCountRef.current = 0;
          manualMood = { state: "happy", until: elapsed + 5 };
          nudgeSleepTimer();
          const preferredSide = launcherSideRef.current;
          setPreferredLauncherSide(preferredSide);
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
        const runtimeSettings = appSettingsRef.current;
        const paused = runtimeSettings?.paused ?? false;
        const focusMode = runtimeSettings?.focusMode ?? false;
        const roaming = roamModeRef.current && !paused;
        const roundedSessionSeconds = Math.floor(elapsed);

        if (roundedSessionSeconds !== sessionSecondsRef.current) {
          sessionSecondsRef.current = roundedSessionSeconds;
          setSessionSeconds(roundedSessionSeconds);
        }

        if (manualMood && elapsed >= manualMood.until) {
          manualMood = null;
          if (!dragging) {
            applyState("idle");
          }
        }

        if (manualReminder && elapsed >= manualReminder.until) {
          manualReminder = null;
        }

        edgeBurstCooldown = Math.max(0, edgeBurstCooldown - deltaSeconds);

        if (!paused && !dragging && elapsed >= sleepDeadline && !manualMood && !roaming) {
          applyState("sleeping");
        }

        if (roaming && !dragging && !manualMood) {
          if (activeState !== "walking") {
            applyState("walking");
          }
        } else if (!roaming && !dragging && !manualMood) {
          if (activeState === "walking") {
            applyState("idle");
          }
        }

        if (
          !paused &&
          !focusMode &&
          !longSessionNudgeShownRef.current &&
          elapsed >= 600
        ) {
          longSessionNudgeShownRef.current = true;
          setLongSessionNudgeShown(true);
          controlsRef.current?.showReminder({
            kind: "focus",
            message: getReminderContent("focus").message,
          });

          if (activeState === "idle") {
            applyState("curious");
          }
        }

        const nextReminder =
          paused || focusMode ? null : reminderScheduler.update(elapsed, remindersRef.current);
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

        const motion = motionController.update({
          activeState,
          centerX: catRoot.x,
          dragging,
          elapsed,
          deltaSeconds,
          facing: activeFacing,
          walking: roaming && !dragging && !manualMood,
          walkTargetX: 0,
          pointerX: pointer.x,
          pullX: pullVector.x,
          pullY: pullVector.y,
        });
        catPositionRef.current = {
          x: centerX + motion.rootX,
          centerX,
        };
        const targetFacing = dragging
          ? pullVector.x < -8
            ? -1
            : pullVector.x > 8
              ? 1
              : activeFacing
          : roaming && !dragging
            ? roamFacingRef.current
          : motion.lookX < -2
            ? -1
            : motion.lookX > 2
              ? 1
              : activeFacing;

        activeFacing = targetFacing;

        catRoot.position.set(centerX + motion.rootX, centerY + motion.rootY);
        const edgeTightness = motion.edgeIntensity * 0.06;
        shadow.scale.x = 1 - stretch * 0.12 - edgeTightness * 0.3;
        shadow.scale.y = 1 - stretch * 0.18 - squash * 0.35 - edgeTightness * 0.5;

        animatedCat.x = motion.lookX + pullVector.x * 0.04;
        animatedCat.y = motion.bob + motion.lookY * 2 + stretch * 6 + squash * 6 + motion.blink * 0.4;
        animatedCat.rotation = motion.rotation + wobble * 0.35;
        const blinkScale = 1 - motion.blink * 0.14;
        const edgeSquash = 1 - motion.edgeIntensity * 0.05;
        animatedCat.scale.set(
          (0.24 - stretch * 0.01 + squash * 0.018 - motion.edgeIntensity * 0.004) * activeFacing,
          (0.24 + stretch * 0.016 - squash * 0.006 + Math.sin(elapsed * 2) * 0.008) * blinkScale * edgeSquash,
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
      appSettingsRef.current = null;
      if (removeEdgeContactListener) {
        removeEdgeContactListener();
        removeEdgeContactListener = null;
      }
      if (removeSettingsListener) {
        removeSettingsListener();
        removeSettingsListener = null;
      }
      if (removeRoamStateListener) {
        removeRoamStateListener();
        removeRoamStateListener = null;
      }
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
    <main className="cat-scene" onPointerDownCapture={handleScenePointerDownCapture}>
      <div className="cat-scene__canvas" ref={hostRef} />

      {launcherVisible ? (
        <div
          ref={launcherRef}
          className={launcherSide === "left" ? "cat-launcher cat-launcher--left" : "cat-launcher cat-launcher--right"}
          aria-label="Quick cat controls"
        >
          <button
            className="cat-launcher__button"
            type="button"
            aria-label={panelOpen ? "Close panel" : "Open panel"}
            onClick={() => {
              if (panelOpen) {
                setPanelOpen(false);
                return;
              }

              openPanel("reminders");
            }}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      ) : null}

      {panelOpen ? (
        <aside
          ref={panelRef}
          className={panelSide === "left" ? "cat-panel cat-panel--left" : "cat-panel cat-panel--right"}
        >
          <div className="cat-panel__header">
            <div>
              <h2>{panelTab === "controls" ? "App Controls" : "Developer Reminders"}</h2>
              <p>
                {panelTab === "controls"
                  ? "Keep the desktop companion easy to manage from inside the app."
                  : "Schedule quiet nudges that fit a coding session."}
              </p>
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

          <div className="cat-panel__tabs" role="tablist" aria-label="Panel tabs">
            <button
              type="button"
              className={panelTab === "reminders" ? "cat-panel__tab cat-panel__tab--active" : "cat-panel__tab"}
              onClick={() => setPanelTab("reminders")}
            >
              Reminders
            </button>
            <button
              type="button"
              className={panelTab === "controls" ? "cat-panel__tab cat-panel__tab--active" : "cat-panel__tab"}
              onClick={() => setPanelTab("controls")}
            >
              Controls
            </button>
          </div>

          {panelTab === "reminders" ? (
            <>
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
            </>
          ) : null}

          {panelTab === "controls" ? (
            <div className="cat-controls">
              <section className="cat-controls__group">
                <h3>Window</h3>
                <div className="cat-controls__row">
                  <button type="button" onClick={() => void window.desktopDevCat.showWindow()}>
                    Show
                  </button>
                  <button type="button" onClick={() => void window.desktopDevCat.hideWindow()}>
                    Hide
                  </button>
                  <button type="button" onClick={() => void window.desktopDevCat.resetWindowPosition()}>
                    Reset
                  </button>
                </div>
              </section>

              <section className="cat-controls__group">
                <h3>Behavior</h3>
                <label className="cat-controls__toggle">
                  <input
                    type="checkbox"
                    checked={appSettings?.paused ?? false}
                    onChange={(event) => void updateAppSettings({ paused: event.target.checked })}
                  />
                  <span>Pause cat behavior</span>
                </label>
                <label className="cat-controls__toggle">
                  <input
                    type="checkbox"
                    checked={appSettings?.focusMode ?? false}
                    onChange={(event) => void updateAppSettings({ focusMode: event.target.checked })}
                  />
                  <span>Focus mode</span>
                </label>
                <label className="cat-controls__toggle">
                  <input
                    type="checkbox"
                    checked={appSettings?.alwaysOnTop ?? false}
                    onChange={(event) =>
                      void updateAppSettings({ alwaysOnTop: event.target.checked })
                    }
                  />
                  <span>Always on top</span>
                </label>
              </section>

              <section className="cat-controls__group">
                <h3>Movement</h3>
                <button
                  type="button"
                  className={roamMode ? "cat-controls__wideButton cat-controls__wideButton--active" : "cat-controls__wideButton"}
                  onClick={toggleRoamMode}
                >
                  {roamMode ? "Stop edge walking" : "Start edge walking"}
                </button>
                <p className="cat-panel__hint">
                  When enabled, the cat will walk across the desktop between edges until you stop it.
                </p>
              </section>

              <section className="cat-controls__group">
                <h3>Startup</h3>
                <label className="cat-controls__toggle">
                  <input
                    type="checkbox"
                    checked={appSettings?.launchAtStartup ?? false}
                    onChange={(event) =>
                      void updateAppSettings({ launchAtStartup: event.target.checked })
                    }
                  />
                  <span>Launch at startup</span>
                </label>
              </section>

              <section className="cat-controls__group">
                <h3>Dev Signal</h3>
                <div className="cat-controls__info">
                  <div>
                    <span>Status</span>
                    <strong>{devSignal?.status ?? "idle"}</strong>
                  </div>
                  <div>
                    <span>Source</span>
                    <strong>{devSignal?.source ?? "none"}</strong>
                  </div>
                  <div>
                    <span>Message</span>
                    <strong>{devSignal?.message ?? "Waiting for the next build signal..."}</strong>
                  </div>
                  <div>
                    <span>Command</span>
                    <strong>{devSignal?.command ?? "Not running a tracked terminal command."}</strong>
                  </div>
                  <div>
                    <span>CWD</span>
                    <strong>{devSignal?.cwd ?? "Shared signal only."}</strong>
                  </div>
                </div>
              </section>

              <section className="cat-controls__group">
                <h3>Session</h3>
                <div className="cat-controls__info">
                  <div>
                    <span>Active time</span>
                    <strong>
                      {Math.floor(sessionSeconds / 60)
                        .toString()
                        .padStart(2, "0")}
                      :
                      {(sessionSeconds % 60).toString().padStart(2, "0")}
                    </strong>
                  </div>
                  <div>
                    <span>Long-session nudge</span>
                    <strong>{longSessionNudgeShown ? "Shown" : "Waiting"}</strong>
                  </div>
                </div>
              </section>

              <section className="cat-controls__group">
                <h3>Build Info</h3>
                <div className="cat-controls__info">
                  <div>
                    <span>App</span>
                    <strong>{runtimeInfo?.appVersion ?? "Loading..."}</strong>
                  </div>
                  <div>
                    <span>Runtime</span>
                    <strong>
                      {runtimeInfo
                        ? `${runtimeInfo.electronVersion} / ${runtimeInfo.nodeVersion}`
                        : "Loading..."}
                    </strong>
                  </div>
                  <div>
                    <span>Target</span>
                    <strong>
                      {runtimeInfo
                        ? `${runtimeInfo.platform}${runtimeInfo.isPackaged ? " / packaged" : " / dev"}`
                        : "Loading..."}
                    </strong>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </aside>
      ) : null}
    </main>
  );
}
