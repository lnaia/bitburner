export const REMOTE_SERVER_PREFIX = "remote-server";
export const HOME_SERVER = "home";
export const DARKWEB_SERVER = "darkweb";
export const SCRIPT_PID_DURATION = "bin/pid-duration.js";
export const SCRIPT_BATCH_JOB = "bin/batch-job.js";
export const SCRIPT_BATCH_JOB_WEAKEN_GROW = "bin/batch-job-weaken-grow.js";
export const SCRIPT_GROW = "hacks/hack-grow.js";
export const SCRIPT_HACK = "hacks/hack-hack.js";
export const SCRIPT_WEAKEN = "hacks/hack-weaken.js";

export const MESSAGE_TYPE = {
  MESSAGE_TYPE_EXEC_SCRIPT: "MESSAGE_TYPE_EXEC_SCRIPT",
} as const;

export const MESSAGE_PORTS = {
  [MESSAGE_TYPE.MESSAGE_TYPE_EXEC_SCRIPT]: 1,
};
export const NO_MESSAGE = "NULL PORT DATA";
//
