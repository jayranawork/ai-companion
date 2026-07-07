export type DevSignalStatus =
  | "starting"
  | "compiling"
  | "long-running"
  | "ready"
  | "error"
  | "restarting";
export type DevSignalSource = "build" | "terminal";
export type DevSignalCommandCategory =
  | "build"
  | "test"
  | "git"
  | "debug"
  | "install"
  | "run"
  | "serve"
  | "watch"
  | "unknown";

export type AppDevSignal = {
  command?: string;
  cwd?: string;
  commandCategory?: DevSignalCommandCategory;
  durationMs?: number;
  exitCode?: number | null;
  longRunning?: boolean;
  message: string;
  source: DevSignalSource;
  status: DevSignalStatus;
  updatedAt: number;
};
