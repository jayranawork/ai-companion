import { spawn } from "node:child_process";
import { mkdir, access, watch } from "node:fs/promises";
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

let rendererProcess = null;
let typecheckProcess = null;
let electronProcess = null;
let shuttingDown = false;
let restartTimer = null;
const watcherAbort = new AbortController();

function log(message) {
  process.stdout.write(`[dev] ${message}\n`);
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

function attachExitLog(child, label) {
  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const suffix =
      code !== null ? `code ${code}` : signal ? `signal ${signal}` : "unknown exit";
    log(`${label} exited (${suffix})`);
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
  electronProcess = spawnNodeScript(electronCli, ["."], {
    VITE_DEV_SERVER_URL: viteUrl,
    OPEN_DEVTOOLS: process.env.OPEN_DEVTOOLS ?? "false",
    DESKTOP_DEV_CAT_USER_DATA_DIR: devUserDataDir,
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

  if (restartTimer) {
    clearTimeout(restartTimer);
  }

  log("main process changed; restarting Electron");
  stopElectron();
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
  rendererProcess = spawnNodeScript(viteScript, []);
  attachExitLog(rendererProcess, "Vite");

  log("starting TypeScript watch for Electron files");
  typecheckProcess = spawnNodeScript(tscScript, [
    "-p",
    "tsconfig.node.json",
    "--watch",
    "--preserveWatchOutput",
  ]);
  attachExitLog(typecheckProcess, "TypeScript watch");

  await waitForHttp(viteUrl);
  await waitForFile(mainOutput);

  startElectron();
  void watchElectronOutput();

  log("dev environment is ready");
}

void main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  void shutdown().finally(() => process.exit(1));
});
