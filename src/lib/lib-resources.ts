import { NS } from "@ns";
import { SCRIPT_HACK, SCRIPT_GROW, SCRIPT_WEAKEN } from "constants";
import { calculateThreads } from "lib/lib-calculate-threads";
import { discoverHosts } from "lib/lib-discover-hosts";
import { log } from "lib/lib-log";
import { printObjList, getActionTimeDuration } from "helper";
import { generateJobPlan } from "lib/lib-hack";

export const totalAvailableRam = (ns: NS, useHome?: boolean) => {
  const resources: { [key: string]: number } = {};
  const rootedServers = discoverHosts(ns).filter((host) =>
    ns.hasRootAccess(host)
  );
  const ownedServers = ns.getPurchasedServers();
  const hosts = [...rootedServers, ...ownedServers];

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

const getScriptToRun = (type: string) => {
  if (type === "grow") {
    return SCRIPT_GROW;
  } else if (type === "weaken") {
    return SCRIPT_WEAKEN;
  } else if (type === "hack") {
    return SCRIPT_HACK;
  }

  return "";
};

const pauseForSeconds = async (ns: NS, seconds: number, scriptName: string) => {
  const ONE_SECOND = 1000;
  let tick = 0;

  if (seconds <= 0) {
    return;
  }

  const { s, m, h } = getActionTimeDuration(seconds * 1000);
  log(ns, `pause for ${s}(s) or ${m}(m) or ${h}(h) due to ${scriptName}`);

  while (tick < s) {
    tick += 1;
    await ns.sleep(ONE_SECOND);
  }
};

type ExecJobProps = {
  ns: NS;
  execHost: string;
  targetHost: string;
  scriptName: string;
  threads: number;
  waitTime?: number;
};
const execJob = async ({
  ns,
  execHost,
  targetHost,
  scriptName,
  threads,
  waitTime = -1,
}: ExecJobProps) => {
  if (threads === 0) {
    return;
  }

  const scriptMemory = ns.getScriptRam(scriptName, execHost);
  const maxThreads = calculateThreads(ns, scriptMemory, execHost);

  if (threads > maxThreads) {
    log(ns, "exec failed - not enough threads");
  } else {
    const pid = ns.exec(scriptName, execHost, threads, targetHost);
    if (pid) {
      log(
        ns,
        `exec pid:${pid} script:${scriptName} host:${targetHost} threads:${threads} from:${execHost}`
      );
      ns.exec("bin/pid-duration.js", execHost, 1, pid);
    } else {
      log(ns, "exec failed - pid is 0");
    }
  }

  if (waitTime !== -1) {
    await pauseForSeconds(ns, waitTime, scriptName);
  }
};

export const resourceManager = async (ns: NS) => {
  const targetHost = "n00dles";
  const execHost = "home";
  const timeMargin = 5;

  const jobPlan = generateJobPlan(ns, targetHost);
  const [initialWeaken, growCash, growWeaken, hack, hackWeaken] = jobPlan;

  // for now, wait until the initial weaken is accomplished.
  await execJob({
    ns,
    execHost,
    targetHost,
    scriptName: getScriptToRun(initialWeaken.type),
    threads: initialWeaken.threads,
    waitTime: initialWeaken.time,
  });

  const sortedJobPlan = [growCash, growWeaken, hack, hackWeaken].sort(
    (a, b) => b.time - a.time
  );
  // @ts-expect-error
  const print = (...args) => ns.print(...args);
  // @ts-expect-error
  printObjList(sortedJobPlan, print);

  // don't wait to spawn the longest running job
  await execJob({
    ns,
    execHost,
    targetHost,
    scriptName: getScriptToRun(sortedJobPlan[0].type),
    threads: sortedJobPlan[0].threads,
  });

  const job2Time = sortedJobPlan[0].time - sortedJobPlan[1].time;
  await execJob({
    ns,
    execHost,
    targetHost,
    scriptName: getScriptToRun(sortedJobPlan[1].type),
    threads: sortedJobPlan[1].threads,
    waitTime: sortedJobPlan[0].threads > 0 ? timeMargin + job2Time : -1,
  });

  const job3Time = job2Time + (sortedJobPlan[1].time - sortedJobPlan[2].time);
  await execJob({
    ns,
    execHost,
    targetHost,
    scriptName: getScriptToRun(sortedJobPlan[2].type),
    threads: sortedJobPlan[2].threads,
    waitTime: sortedJobPlan[1].threads > 0 ? timeMargin + job3Time : -1,
  });

  const job4Time = job3Time + (sortedJobPlan[2].time - sortedJobPlan[3].time);
  await execJob({
    ns,
    execHost,
    targetHost,
    scriptName: getScriptToRun(sortedJobPlan[3].type),
    threads: sortedJobPlan[3].threads,
    waitTime: sortedJobPlan[2].threads > 0 ? timeMargin + job4Time : -1,
  });
};
