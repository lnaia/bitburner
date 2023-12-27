import { NS } from "@ns";
import { log } from "./lib-log";
import {
  HOME_SERVER,
  SCRIPT_GROW,
  SCRIPT_HACK,
  SCRIPT_RAM_AVERAGE,
  SCRIPT_WEAKEN,
} from "constants";
import {
  discoverHosts,
  getHacknetNodeHostsnames,
} from "lib/lib-discover-hosts";
import { isHomeUsageAllowed } from "lib/lib-use-home-server";
import { isHackedServerUsageAllowed } from "lib/lib-use-hacked-servers";

export type ThreadsReservedMap = {
  [key: string]: {
    threadsReserved: number;
    executionTime: number;
  }[];
};

export const totalAvailableRam = (ns: NS) => {
  const hacknetNodes = getHacknetNodeHostsnames(ns);
  const resources: { [key: string]: number } = {};
  const hosts = [...ns.getPurchasedServers(), ...hacknetNodes];

  // by default home usage isn't allowed, unless a file is created.
  // for more info see respective bin/toggle
  if (isHomeUsageAllowed(ns)) {
    hosts.unshift(HOME_SERVER);
  }

  // on some bitnodes, using hacked hosts is the worst possible outcome
  // due to the lack of cores > 1
  if (isHackedServerUsageAllowed(ns)) {
    discoverHosts(ns)
      .filter((host) => ns.hasRootAccess(host))
      .forEach((host) => hosts.push(host));
  }

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
  reservedThreads,
  script,
}: {
  ns: NS;
  reservedThreads: ThreadsReservedMap;
  script: string;
}) => {
  const scriptRam = SCRIPT_RAM_AVERAGE;
  const tempFleetFreeMemory = totalAvailableRam(ns);
  let fleetFreeMemory = tempFleetFreeMemory;

  // cores on home server inc effectiveness of grow and weaken
  // thus if it's not one of these 2 scripts, try to allocate to the other servers first
  //
  if (script === SCRIPT_HACK) {
    fleetFreeMemory = Object.entries(fleetFreeMemory)
      .reverse()
      .reduce(
        (acc: { [key: string]: number }, [k, v]) => ((acc[k] = v), acc),
        {}
      );
  }

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

export type ExecPlan = { host: string; threadsUsed: number; pid?: number };
const execScript = ({
  ns,
  scriptExecPlan,
  targetHost,
  script,
  stocks = false,
}: {
  ns: NS;
  scriptExecPlan: ExecPlan[];
  targetHost: string;
  script: string;
  stocks?: boolean;
}): ExecPlan[] => {
  return scriptExecPlan.map(({ host, threadsUsed }) => {
    const pid = ns.exec(script, host, threadsUsed, targetHost, stocks);

    // const msg = `exec pid:${pid} script:${script} host:${targetHost} threads:${threadsUsed} from:${host}`;
    // log(ns, msg);

    return {
      pid,
      host,
      threadsUsed,
    };
  });
};

export type MessagePayload = {
  script: string;
  threads: number;
  targetHost: string;
  allThreads?: boolean;
};
export type RequestExecProps = {
  ns: NS;
  message: MessagePayload;
  totalThreads: number;
  threadMap: ThreadMap;
  stocks?: boolean;
};

export const requestExecScript = ({
  ns,
  message,
  totalThreads,
  threadMap,
  stocks = false,
}: RequestExecProps): [number, ExecPlan[]?] => {
  const { script, threads, targetHost, allThreads } = message;
  const scriptExecutionTime = getScriptExecutionTime(ns, script, targetHost);

  if (threads <= 0) {
    log(ns, `exec failed - no threads:${threads} requested`);
    return [0];
  }

  if (totalThreads <= 0) {
    log(ns, `exec failed - no threads available totalThreads:${totalThreads}`);
    return [0];
  }

  if (allThreads && threads > totalThreads) {
    log(
      ns,
      `exec failed - not enough threads threads:${threads} totalThreads:${totalThreads}`
    );
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
    stocks,
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

    const res = hostAvailableThreads - hostReservedThreads;
    const parsedAvailableThreads = res > 0 ? res : 0;
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
    const { host, threadsUsed, pid } = execPlan;

    if (!(host in reservedThreads)) {
      reservedThreads[host] = [];
    }

    if (pid && threadsUsed > 0) {
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
    list.forEach((value, index) => {
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
  allThreads,
  stocks = false,
}: {
  ns: NS;
  targetHost: string;
  script: string;
  threads: number;
  reservedThreads: ThreadsReservedMap;
  allThreads: boolean;
  stocks?: boolean;
}) => {
  const { totalThreads, threadMap } = getThreadsAvailable({
    ns,
    reservedThreads,
    script,
  });

  const message = { targetHost, script, threads, allThreads };
  const [executionTime, executedPlan] = requestExecScript({
    ns,
    message,
    totalThreads,
    threadMap,
    stocks,
  });

  return combineReservedThreads({
    executionTime,
    executionPlan: executedPlan,
    reservedThreads,
  });
};
