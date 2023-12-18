import { NS } from "@ns";
import { log } from "./lib-log";
import {
  HOME_SERVER,
  SCRIPT_GROW,
  SCRIPT_HACK,
  SCRIPT_WEAKEN,
} from "constants";

export type ThreadsReservedMap = {
  [key: string]: {
    threadsReserved: number;
    executionTime: number;
  }[];
};

export const totalAvailableRam = (ns: NS) => {
  const resources: { [key: string]: number } = {};
  const hosts = [...ns.getPurchasedServers(), HOME_SERVER];

  for (const host of hosts) {
    const serverMaxRam = ns.getServerMaxRam(host);
    const serverRamInUse = ns.getServerUsedRam(host);

    const serverRamAvailable = serverMaxRam - serverRamInUse;
    resources[host] = serverRamAvailable;
  }

  return resources;
};

export type ThreadMap = { [key: string]: number };
export const getThreadsAvailable = ({
  ns,
  script,
  threads,
  reservedThreads,
}: {
  ns: NS;
  script: string;
  threads: number;
  reservedThreads: ThreadsReservedMap;
}) => {
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

  const { parsedTotalThreads, parsedThreadMap } = filterReservedThreads({
    totalThreads,
    threadMap,
    reservedThreads,
  });

  return {
    totalThreads: parsedTotalThreads,
    threadMap: parsedThreadMap,
  };
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
  return scriptExecPlan.map(({ host, threadsUsed }) => {
    const pid = ns.exec(script, host, threadsUsed, targetHost);
    const msg = `pid:${pid} script:${script} host:${targetHost} threads:${threadsUsed} from:${host}`;
    if (pid) {
      log(ns, `exec success ${msg}`);
    } else {
      log(ns, `exec failed ${msg}`);
    }

    return { host, threadsUsed: pid ? threadsUsed : 0 };
  });
};

export type MessagePayload = {
  script: string;
  threads: number;
  targetHost: string;
};
export type RequestExecProps = {
  ns: NS;
  message: MessagePayload;
  totalThreads: number;
  threadMap: ThreadMap;
};

export const requestExecScript = ({
  ns,
  message,
  totalThreads,
  threadMap,
}: RequestExecProps): [number, ExecPlan[]?] => {
  const { script, threads, targetHost } = message;
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

  const executedPlan = execScript({
    ns,
    scriptExecPlan,
    targetHost,
    script,
  });

  // extra seconds of reserved time as a security margin
  return [scriptExecutionTime + 5, executedPlan];
};

export const filterReservedThreads = ({
  threadMap,
  reservedThreads,
}: {
  totalThreads: number;
  threadMap: ThreadMap;
  reservedThreads: ThreadsReservedMap;
}) => {
  let parsedTotalThreads = 0;
  const parsedThreadMap: ThreadMap = {};
  const currentThreadMap = threadMap;

  Object.entries(currentThreadMap).forEach(([host, hostAvailableThreads]) => {
    let hostReservedThreads = 0;

    // find threads already reserved in this host
    if (host in reservedThreads) {
      hostReservedThreads = reservedThreads[host].reduce(
        (res, { threadsReserved }) => {
          return res + threadsReserved;
        },
        0
      );
    }

    const parsedAvailableThreads = hostAvailableThreads - hostReservedThreads;
    parsedThreadMap[host] = parsedAvailableThreads;
    parsedTotalThreads += parsedAvailableThreads;
  });

  return {
    parsedTotalThreads,
    parsedThreadMap,
  };
};

type CombineProps = {
  executionTime: number;
  executionPlan?: ExecPlan[];
  reservedThreads: ThreadsReservedMap;
};
const combineReservedThreads = ({
  executionTime,
  executionPlan,
  reservedThreads,
}: CombineProps) => {
  // add execution plan, to reserved theadsMap
  executionPlan?.forEach((execPlan: ExecPlan) => {
    const { host, threadsUsed } = execPlan;

    if (!(host in reservedThreads)) {
      reservedThreads[host] = [];
    }

    if (threadsUsed > 0) {
      reservedThreads[host].push({
        threadsReserved: threadsUsed,
        executionTime,
      });
    }
  });

  return reservedThreads;
};

type ManageProps = {
  reservedThreads: ThreadsReservedMap;
};
export const manageThreadReservedTime = ({ reservedThreads }: ManageProps) => {
  // cleanup reserved threads based on time.
  Object.entries(reservedThreads).forEach(([host, list]) => {
    list.every((value, index) => {
      if (reservedThreads[host][index].executionTime > 0) {
        reservedThreads[host][index].executionTime -= 1;
      }
    });

    reservedThreads[host] = list.filter(
      ({ executionTime }) => executionTime > 0
    );

    if (reservedThreads[host].length === 0) {
      delete reservedThreads[host];
    }
  });

  return reservedThreads;
};

export const threadManager = ({
  ns,
  targetHost,
  script,
  threads,
  reservedThreads,
}: {
  ns: NS;
  targetHost: string;
  script: string;
  threads: number;
  reservedThreads: ThreadsReservedMap;
}) => {
  const { totalThreads, threadMap } = getThreadsAvailable({
    ns,
    script,
    threads,
    reservedThreads,
  });

  const message = { targetHost, script, threads };
  const [executionTime, executedPlan] = requestExecScript({
    ns,
    message,
    totalThreads,
    threadMap,
  });

  return combineReservedThreads({
    executionTime,
    executionPlan: executedPlan,
    reservedThreads,
  });
};
