import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { classifyCommandText } from "./devSignalClassifier.mjs";

const args = process.argv.slice(2);
const commandIndex = args[0] === "--" ? 1 : 0;
const command = args[commandIndex];
const commandArgs = args.slice(commandIndex + 1);
const signalDir = process.env.DESKTOP_DEV_CAT_SIGNAL_DIR ?? path.join(os.homedir(), ".desktop-dev-cat");
const signalPath = path.join(signalDir, "activity-signal.json");
const cwd = process.cwd();
const LONG_RUNNING_DELAY_MS = 120000;
let longRunningTimer = null;
let commandStartedAt = 0;

function writeSignal(status, message, extras = {}) {
  mkdirSync(signalDir, { recursive: true });
  writeFileSync(
    signalPath,
    JSON.stringify(
      {
        source: "terminal",
        status,
        message,
        updatedAt: Date.now(),
        cwd,
        ...extras,
      },
      null,
      2,
    ),
    "utf8",
  );
}

function inferStatus(category) {
  return category === "build" || category === "test" ? "compiling" : "starting";
}

function clearLongRunningTimer() {
  if (longRunningTimer) {
    clearTimeout(longRunningTimer);
    longRunningTimer = null;
  }
}

if (!command) {
  process.stderr.write("Usage: node scripts/track-terminal.mjs -- <command> [args...]\n");
  process.exit(1);
}

const commandText = [command, ...commandArgs].join(" ");
const classification = classifyCommandText(commandText);
commandStartedAt = Date.now();

writeSignal(inferStatus(classification.category), `Running ${classification.label}: ${commandText}`, {
  command: commandText,
  commandCategory: classification.category,
});

if (classification.isLongRunningCandidate) {
  longRunningTimer = setTimeout(() => {
    longRunningTimer = null;
    writeSignal("long-running", `${classification.label} is still running: ${commandText}`, {
      command: commandText,
      commandCategory: classification.category,
      longRunning: true,
      durationMs: Date.now() - commandStartedAt,
    });
  }, LONG_RUNNING_DELAY_MS);
}

const child = spawn(command, commandArgs, {
  cwd,
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    DESKTOP_DEV_CAT_SIGNAL_DIR: signalDir,
  },
});

child.on("exit", (code, signal) => {
  clearLongRunningTimer();

  if (code === 0) {
    writeSignal("ready", `Finished terminal command: ${commandText}`, {
      command: commandText,
      commandCategory: classification.category,
      exitCode: code,
      durationMs: Date.now() - commandStartedAt,
    });
    process.exit(0);
  }

  const suffix = code !== null ? `code ${code}` : signal ? `signal ${signal}` : "unknown exit";
  writeSignal("error", `Terminal command failed: ${commandText} (${suffix})`, {
    command: commandText,
    commandCategory: classification.category,
    exitCode: code,
    durationMs: Date.now() - commandStartedAt,
  });
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  clearLongRunningTimer();
  writeSignal("error", `Terminal command could not start: ${commandText}`, {
    command: commandText,
    commandCategory: classification.category,
  });
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
