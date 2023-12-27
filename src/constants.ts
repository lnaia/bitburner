export const REMOTE_SERVER_PREFIX = "remote-server";
export const HACKNET_NODE_PREFIX = "hacknet-server";
export const HOME_SERVER = "home";
export const DARKWEB_SERVER = "darkweb";
export const SCRIPT_PID_DURATION = "bin/pid-duration.js";
export const SCRIPT_BATCH_JOB = "bin/batch-job.js";
export const SCRIPT_BATCH_JOB_WEAKEN_GROW = "bin/batch-job-weaken-grow.js";
export const SCRIPT_GROW = "hacks/hack-grow.js";
export const SCRIPT_HACK = "hacks/hack-hack.js";
export const SCRIPT_WEAKEN = "hacks/hack-weaken.js";
export const SCRIPT_MONITOR_HOST = "bin/monitor-host.js";
export const SCRIPT_RAM_AVERAGE = 1.75;
export const HOME_SERVER_USAGE_FILE = "use-home-server.txt";
export const HACKED_SERVERS_USAGE_FILE = "use-hacked-servers.txt";

export const MESSAGE_TYPE = {
  MESSAGE_TYPE_EXEC_SCRIPT: "MESSAGE_TYPE_EXEC_SCRIPT",
} as const;

export const MESSAGE_PORTS = {
  [MESSAGE_TYPE.MESSAGE_TYPE_EXEC_SCRIPT]: 1,
};
export const NO_MESSAGE = "NULL PORT DATA";
