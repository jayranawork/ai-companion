import { mkdirSync } from "node:fs";
import path from "node:path";
import { app } from "electron";
import pino from "pino";

export type AppLogger = ReturnType<typeof createAppLogger>;

function resolveLogDirectory() {
  const baseDir = process.env.DESKTOP_DEV_CAT_USER_DATA_DIR ?? app.getPath("userData");
  return path.join(baseDir, "logs");
}

export function createAppLogger() {
  const logDir = resolveLogDirectory();
  mkdirSync(logDir, { recursive: true });

  const logFilePath = path.join(logDir, "desktop-dev-cat.log");
  const logger = pino(
    {
      level: process.env.LOG_LEVEL ?? "info",
    },
    pino.destination({
      dest: logFilePath,
      sync: false,
    }),
  );

  return {
    logFilePath,
    logger,
  };
}
