import { NS } from "@ns";
import { log } from "./lib-log";
import { SCRIPT_GROW, SCRIPT_HACK, SCRIPT_WEAKEN } from "/constants";

export const totalAvailableRam = (ns: NS, useHome = false) => {
  const resources: { [key: string]: number } = {};
  const hosts = ns.getPurchasedServers();

  if (useHome) {
    hosts.push("home");
  }

  for (const host of hosts) {
    const serverMaxRam = ns.getServerMaxRam(host);
    const serverRamInUse = ns.getServerUsedRam(host);

    const serverRamAvailable = serverMaxRam - serverRamInUse;
    resources[host] = serverRamAvailable;
  }

  return resources;
};
export type ThreadsAvailable = [number, ThreadMap];

export type ThreadMap = {
  [key: string]: number;
};
export const getThreadsAvailable = (
  ns: NS,
  script: string
): ThreadsAvailable => {
  const scriptRam = ns.getScriptRam(script);
  const fleetFreeMemory = totalAvailableRam(ns);

  const threadMap: ThreadMap = {};
  let totalThreads = 0;

  Object.entries(fleetFreeMemory).forEach(([host, serverRamAvailable]) => {
    if (serverRamAvailable > 0) {
      const threads = Math.floor(serverRamAvailable / scriptRam);
      totalThreads += threads;
      threadMap[host] = threads;
    }
  });

  return [totalThreads, threadMap];
};

const getScriptExecutionTime = (ns: NS, script: string, targetHost: string) => {
  let miliseconds = 0;
  if (script === SCRIPT_HACK) {
    miliseconds = ns.getHackTime(targetHost);
  } else if (script === SCRIPT_GROW) {
    miliseconds = ns.getGrowTime(targetHost);
  } else if (script === SCRIPT_WEAKEN) {
    miliseconds = ns.getWeakenTime(targetHost);
  } else {
    const msg = `fatal - unexpected script given: ${script}`;
    ns.tprint(msg);
    ns.print(msg);
    ns.exit();
  }

  return Math.ceil(miliseconds / 1000);
};

export type ExecPlan = { host: string; threadsUsed: number };
const execScript = ({
  ns,
  scriptExecPlan,
  targetHost,
  script,
}: {
  ns: NS;
  scriptExecPlan: ExecPlan[];
  targetHost: string;
  script: string;
}) => {
  scriptExecPlan.forEach(({ host, threadsUsed }) => {
    const pid = ns.exec(script, host, threadsUsed, targetHost);
    if (pid) {
      log(
        ns,
        `exec pid:${pid} script:${script} host:${targetHost} threads:${threadsUsed} from:${host}`
      );
    } else {
      log(ns, "exec failed - pid is 0");
    }
  });
};

export type MessagePayload = {
  script: string;
  threads: number;
  targetHost: string;
};
export const requestExecScript = (
  ns: NS,
  message: MessagePayload,
  threadsAvailable: ThreadsAvailable
): [number, ExecPlan[]?] => {
  const { script, threads, targetHost } = message;
  const [totalThreads, threadMap] = threadsAvailable;
  const scriptExecutionTime = getScriptExecutionTime(ns, script, targetHost);

  if (threads > totalThreads) {
    log(ns, "exec failed - not enough threads");
    return [0];
  }

  const scriptExecPlan: ExecPlan[] = [];
  let threadsNeeded = threads;

  for (const [host, threadsAvailable] of Object.entries(threadMap)) {
    let threadsUsed = 0;

    if (threadsNeeded <= threadsAvailable) {
      threadMap[host] = threadsAvailable - threadsNeeded;
      threadsUsed = threadsNeeded;
      threadsNeeded = 0;
    } else {
      threadMap[host] = 0;
      threadsNeeded -= threadsAvailable;
      threadsUsed = +threadsAvailable;
    }

    if (threadsUsed > 0) {
      scriptExecPlan.push({ host, threadsUsed });
    }

    if (threadsNeeded === 0) {
      break;
    }
  }

  log(
    ns,
    JSON.stringify({
      scriptExecutionTime,
      scriptExecPlan,
    })
  );

  execScript({
    ns,
    scriptExecPlan,
    targetHost,
    script,
  });

  return [scriptExecutionTime + 5, scriptExecPlan]; //  extra seconds of reserved time as a security margin
};
