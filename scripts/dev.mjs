import { spawn } from "node:child_process";
import { mkdir, access, watch } from "node:fs/promises";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const distElectronDir = path.join(rootDir, "dist-electron");
const mainOutput = path.join(distElectronDir, "main", "main.js");
const viteScript = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
const tscScript = path.join(rootDir, "node_modules", "typescript", "lib", "tsc.js");
const electronCli = path.join(rootDir, "node_modules", "electron", "cli.js");
const viteUrl = "http://127.0.0.1:5173";
const devUserDataDir = path.join(rootDir, ".desktop-dev-cat-devdata");
const devSignalDir = process.env.DESKTOP_DEV_CAT_SIGNAL_DIR ?? path.join(os.homedir(), ".desktop-dev-cat");
const devSignalPath = path.join(devSignalDir, "activity-signal.json");

let rendererProcess = null;
let typecheckProcess = null;
let electronProcess = null;
let shuttingDown = false;
let restartTimer = null;
let buildRestartTimer = null;
let buildRestartPending = false;
let buildPhaseActive = false;
let buildLongRunningTimer = null;
let buildPhaseStartedAt = 0;
const watcherAbort = new AbortController();

function log(message) {
  process.stdout.write(`[dev] ${message}\n`);
}

function writeDevSignal(status, message, extras = {}) {
  mkdirSync(devSignalDir, { recursive: true });
  writeFileSync(
    devSignalPath,
    JSON.stringify(
      {
        source: "build",
        ...extras,
        status,
        message,
        updatedAt: Date.now(),
      },
      null,
      2,
    ),
    "utf8",
  );
}

function clearBuildLongRunningTimer() {
  if (buildLongRunningTimer) {
    clearTimeout(buildLongRunningTimer);
    buildLongRunningTimer = null;
  }
}

function startBuildLongRunningTimer(message) {
  clearBuildLongRunningTimer();

  buildLongRunningTimer = setTimeout(() => {
    buildLongRunningTimer = null;

    if (shuttingDown || !buildPhaseActive) {
      return;
    }

    writeDevSignal("long-running", message, {
      commandCategory: "build",
      longRunning: true,
      durationMs: Date.now() - buildPhaseStartedAt,
    });
  }, 20000);
}

function spawnNodeScript(scriptPath, args, extraEnv = {}) {
  return spawn(process.execPath, [scriptPath, ...args], {
    cwd: rootDir,
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: "inherit",
    shell: false,
  });
}

function attachExitLog(child, label, extras = {}) {
  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const suffix =
      code !== null ? `code ${code}` : signal ? `signal ${signal}` : "unknown exit";
    log(`${label} exited (${suffix})`);
    clearBuildLongRunningTimer();
    buildPhaseActive = false;
    writeDevSignal("error", `${label} exited (${suffix}).`, {
      commandCategory: "build",
      ...extras,
    });
  });
}

async function waitForFile(filePath) {
  for (;;) {
    try {
      await access(filePath);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

async function waitForHttp(url) {
  for (;;) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until the renderer server is ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

function stopElectron() {
  if (!electronProcess) {
    return;
  }

  const current = electronProcess;
  electronProcess = null;

  if (current.exitCode === null && !current.killed) {
    current.kill();
  }
}

function startElectron() {
  if (shuttingDown) {
    return;
  }

  if (electronProcess) {
    return;
  }

  log("starting Electron");
  buildPhaseActive = false;
  clearBuildLongRunningTimer();
  writeDevSignal("ready", "Electron is running and the app is ready.", {
    commandCategory: "build",
    durationMs: buildPhaseStartedAt ? Date.now() - buildPhaseStartedAt : undefined,
  });
  electronProcess = spawnNodeScript(electronCli, ["."], {
    VITE_DEV_SERVER_URL: viteUrl,
    OPEN_DEVTOOLS: process.env.OPEN_DEVTOOLS ?? "false",
    DESKTOP_DEV_CAT_USER_DATA_DIR: devUserDataDir,
    DESKTOP_DEV_CAT_SIGNAL_DIR: devSignalDir,
    DESKTOP_DEV_CAT_DISABLE_GPU: "1",
  });

  electronProcess.on("exit", (code, signal) => {
    electronProcess = null;

    if (shuttingDown) {
      return;
    }

    const suffix =
      code !== null ? `code ${code}` : signal ? `signal ${signal}` : "unknown exit";
    log(`Electron exited (${suffix}); relaunching`);

    if (restartTimer) {
      clearTimeout(restartTimer);
    }

    restartTimer = setTimeout(() => {
      restartTimer = null;
      startElectron();
    }, 300);
  });
}

function requestElectronRestart() {
  if (shuttingDown) {
    return;
  }

  if (buildRestartPending) {
    return;
  }

  buildPhaseStartedAt = Date.now();
  buildPhaseActive = true;
  writeDevSignal("compiling", "Main process changed. Rebuilding Electron files...", {
    commandCategory: "build",
    durationMs: 0,
  });
  startBuildLongRunningTimer("Electron rebuild is taking a while.");

  buildRestartPending = true;

  if (buildRestartTimer) {
    clearTimeout(buildRestartTimer);
  }

  buildRestartTimer = setTimeout(() => {
    buildRestartTimer = null;

    if (shuttingDown) {
      return;
    }

    log("main process changed; restarting Electron");
    stopElectron();
    buildRestartPending = false;
  }, 180);
}

async function watchElectronOutput() {
  await mkdir(distElectronDir, { recursive: true });

  try {
    for await (const event of watch(distElectronDir, {
      recursive: true,
      signal: watcherAbort.signal,
    })) {
      if (shuttingDown) {
        return;
      }

      if (!event.filename) {
        requestElectronRestart();
        continue;
      }

      if (!/\.(js|json|map)$/i.test(event.filename)) {
        continue;
      }

      requestElectronRestart();
    }
  } catch (error) {
    if (!shuttingDown) {
      const message = error instanceof Error ? error.message : String(error);
      log(`file watcher stopped unexpectedly: ${message}`);
    }
  }
}

async function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }

  if (buildRestartTimer) {
    clearTimeout(buildRestartTimer);
    buildRestartTimer = null;
  }

  clearBuildLongRunningTimer();
  buildPhaseActive = false;

  if (rendererProcess && rendererProcess.exitCode === null && !rendererProcess.killed) {
    rendererProcess.kill();
  }

  if (typecheckProcess && typecheckProcess.exitCode === null && !typecheckProcess.killed) {
    typecheckProcess.kill();
  }

  stopElectron();
  watcherAbort.abort();
}

process.on("SIGINT", () => {
  void shutdown().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0));
});

async function main() {
  log("starting renderer dev server");
  buildPhaseStartedAt = Date.now();
  buildPhaseActive = true;
  writeDevSignal("starting", "Starting the dev environment...", {
    commandCategory: "build",
  });
  rendererProcess = spawnNodeScript(viteScript, []);
  attachExitLog(rendererProcess, "Vite", { commandCategory: "build" });

  log("starting TypeScript watch for Electron files");
  writeDevSignal("compiling", "Building Electron files...", {
    commandCategory: "build",
    durationMs: 0,
  });
  startBuildLongRunningTimer("Initial Electron build is taking a while.");
  typecheckProcess = spawnNodeScript(tscScript, [
    "-p",
    "tsconfig.node.json",
    "--watch",
    "--preserveWatchOutput",
  ]);
  attachExitLog(typecheckProcess, "TypeScript watch", { commandCategory: "build" });

  await waitForHttp(viteUrl);
  await waitForFile(mainOutput);

  startElectron();
  void watchElectronOutput();

  log("dev environment is ready");
  clearBuildLongRunningTimer();
  buildPhaseActive = false;
  writeDevSignal("ready", "Dev environment is ready.", {
    commandCategory: "build",
    durationMs: Date.now() - buildPhaseStartedAt,
  });
}

void main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  void shutdown().finally(() => process.exit(1));
});
