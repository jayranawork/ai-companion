export type DevSignalStatus = "starting" | "compiling" | "ready" | "error" | "restarting";
export type DevSignalSource = "build" | "terminal";

export type AppDevSignal = {
  command?: string;
  cwd?: string;
  exitCode?: number | null;
  message: string;
  source: DevSignalSource;
  status: DevSignalStatus;
  updatedAt: number;
};
