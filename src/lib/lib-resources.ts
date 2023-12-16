import { NS } from "@ns";
import {
  SCRIPT_HACK,
  SCRIPT_GROW,
  SCRIPT_WEAKEN,
  SCRIPT_BATCH_JOB,
  HOME_SERVER,
  SCRIPT_PID_DURATION,
} from "constants";
import { calculateThreads } from "lib/lib-calculate-threads";
import { discoverHosts } from "lib/lib-discover-hosts";
import { log } from "lib/lib-log";
import { printObjList, getActionTimeDuration } from "helper";
import { generateJobPlan, JobPlan } from "lib/lib-hack";
import { hostInfo } from "lib/lib-host-info";

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
    log(ns, `exec 0 threads given - script:${scriptName} host:${targetHost}`);
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
      // ns.exec(SCRIPT_PID_DURATION, execHost, 1, pid);
    } else {
      log(ns, "exec failed - pid is 0");
    }
  }

  if (waitTime !== -1) {
    await pauseForSeconds(ns, waitTime, scriptName);
  }
};

const TIME_MARGIN_IN_SECONDS = 5;

const generateStats = (ns: NS, targetHost: string) => {
  const jobPlan = generateJobPlan(ns, targetHost);

  const jobsWithThreads = jobPlan
    .filter((jp) => jp.threads > 0)
    .sort((a, b) => b.time - a.time);

  const estimatedRunTime =
    jobsWithThreads[0].time +
    (jobsWithThreads.length - 1) * TIME_MARGIN_IN_SECONDS;

  const totalThreads = jobPlan.reduce((res, item) => {
    return res + item.threads;
  }, 0);

  const totalScriptRam = jobPlan
    .map((jp) => {
      return {
        ...jp,
        ram: ns.getScriptRam(getScriptToRun(jp.type)),
      };
    })
    .reduce((res, item) => {
      return res + item.ram;
    }, 0);

  log(
    ns,
    JSON.stringify(
      {
        estimatedRunTime,
        totalThreads,
        totalScriptRam,
      },
      null,
      2
    )
  );

  // this is useful, as it limits the waiting time, for this host, for this job plan at maximum.
  // from this server.
  return estimatedRunTime;
  //    {
  //   "estimatedRunTime": 61,
  //   "totalThreads": 34,
  //   "totalScriptRam": 8.7,
  // }
};

export const resourceManager = async (ns: NS) => {
  const hosts = discoverHosts(ns).filter((host) => {
    const hasRoot = ns.hasRootAccess(host);
    const info = hostInfo(ns, host);

    return hasRoot && info.hc >= 90 && info.diff === "0.0000";
  });

  for (const host of hosts) {
    const estimatedRunTime = generateStats(ns, host);
    const jobPlan = generateJobPlan(ns, host);
    // ns.exec(
    //   SCRIPT_BATCH_JOB,
    //   HOME_SERVER,
    //   1,
    //   host,
    //   JSON.stringify(jobPlan),
    //   estimatedRunTime
    // );
  }
};

export const batchJobs = async (
  ns: NS,
  jobPlan: JobPlan[],
  targetHost: string
) => {
  const execHost = "home";
  const startDate = new Date();

  const [initialWeaken, growCash, growWeaken, hack, hackWeaken] = jobPlan;
  log(ns, "full batch start");

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
    waitTime:
      sortedJobPlan[0].threads > 0 ? TIME_MARGIN_IN_SECONDS + job2Time : -1,
  });

  const job3Time = job2Time + (sortedJobPlan[1].time - sortedJobPlan[2].time);
  await execJob({
    ns,
    execHost,
    targetHost,
    scriptName: getScriptToRun(sortedJobPlan[2].type),
    threads: sortedJobPlan[2].threads,
    waitTime:
      sortedJobPlan[1].threads > 0 ? TIME_MARGIN_IN_SECONDS + job3Time : -1,
  });

  const job4Time = job3Time + (sortedJobPlan[2].time - sortedJobPlan[3].time);
  await execJob({
    ns,
    execHost,
    targetHost,
    scriptName: getScriptToRun(sortedJobPlan[3].type),
    threads: sortedJobPlan[3].threads,
    waitTime:
      sortedJobPlan[3].threads > 0 ? TIME_MARGIN_IN_SECONDS + job4Time : -1,
  });

  const endDate = new Date();

  log(
    ns,
    `full batch finish, total run time: ${
      (endDate.getTime() - startDate.getTime()) / 1000
    } seconds`
  );
};

export const batchJobsWeakenGrow = async (
  ns: NS,
  jobPlan: JobPlan[],
  targetHost: string
) => {
  const execHost = "home";
  const startDate = new Date();

  const [initialWeaken, growCash, growWeaken] = jobPlan;
  log(ns, "full batch start");

  // for now, wait until the initial weaken is accomplished.
  await execJob({
    ns,
    execHost,
    targetHost,
    scriptName: getScriptToRun(initialWeaken.type),
    threads: initialWeaken.threads,
    waitTime: initialWeaken.time,
  });

  const sortedJobPlan = [growCash, growWeaken].sort((a, b) => b.time - a.time);

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
    waitTime:
      sortedJobPlan[0].threads > 0 ? TIME_MARGIN_IN_SECONDS + job2Time : -1,
  });

  const endDate = new Date();

  log(
    ns,
    `full batch finish, total run time: ${
      (endDate.getTime() - startDate.getTime()) / 1000
    } seconds`
  );
};
