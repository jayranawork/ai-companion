import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const commandIndex = args[0] === "--" ? 1 : 0;
const command = args[commandIndex];
const commandArgs = args.slice(commandIndex + 1);
const signalDir = process.env.DESKTOP_DEV_CAT_SIGNAL_DIR ?? path.join(os.homedir(), ".desktop-dev-cat");
const signalPath = path.join(signalDir, "activity-signal.json");
const cwd = process.cwd();

function inferStatus(commandText) {
  return /(build|compile|test|dev|serve|watch|run)/i.test(commandText) ? "compiling" : "starting";
}

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

if (!command) {
  process.stderr.write("Usage: node scripts/track-terminal.mjs -- <command> [args...]\n");
  process.exit(1);
}

const commandText = [command, ...commandArgs].join(" ");
writeSignal(inferStatus(commandText), `Running terminal command: ${commandText}`, {
  command: commandText,
});

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
  if (code === 0) {
    writeSignal("ready", `Finished terminal command: ${commandText}`, {
      command: commandText,
      exitCode: code,
    });
    process.exit(0);
  }

  const suffix = code !== null ? `code ${code}` : signal ? `signal ${signal}` : "unknown exit";
  writeSignal("error", `Terminal command failed: ${commandText} (${suffix})`, {
    command: commandText,
    exitCode: code,
  });
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  writeSignal("error", `Terminal command could not start: ${commandText}`, {
    command: commandText,
  });
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
