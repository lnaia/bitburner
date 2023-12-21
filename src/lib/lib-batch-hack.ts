import { NS } from "@ns";
import {
  SCRIPT_HACK,
  SCRIPT_GROW,
  SCRIPT_WEAKEN,
  SCRIPT_BATCH_JOB,
  HOME_SERVER,
  MESSAGE_TYPE,
} from "constants";
import { discoverHosts } from "lib/lib-discover-hosts";
import { log } from "lib/lib-log";
import { printObjList, getActionTimeDuration } from "helper";
import { generateJobPlan, JobPlan } from "lib/lib-hack";
import { hostInfo } from "lib/lib-host-info";
import { calcWeakenThreads } from "lib/lib-weaken";
import { sendMessages } from "lib/lib-messages";
import { calculateThreadsGrow } from "lib/lib-grow";

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
  if (seconds <= 0) {
    return;
  }

  const { s, m, h } = getActionTimeDuration(seconds * 1000);
  log(ns, `pause for ${s}(s) or ${m}(m) or ${h}(h) due to ${scriptName}`);

  let tick = 0;
  while (tick < seconds) {
    tick += 1;
    await ns.sleep(1_000);
  }
};

type ExecJobProps = {
  ns: NS;
  targetHost: string;
  scriptName: string;
  threads: number;
  waitTime?: number;
  allThreads?: boolean;
};
const execJob = async ({
  ns,
  targetHost,
  scriptName,
  threads,
  waitTime = -1,
  allThreads = true,
}: ExecJobProps) => {
  if (threads === 0) {
    return;
  }

  await sendMessages(ns, {
    type: MESSAGE_TYPE.MESSAGE_TYPE_EXEC_SCRIPT,
    payload: {
      targetHost,
      script: scriptName,
      threads,
      allThreads,
    },
  });

  if (waitTime !== -1) {
    await pauseForSeconds(ns, waitTime, scriptName);
  }
};

const TIME_MARGIN_IN_SECONDS = 5;

export const resourceManagerSingleHost = (ns: NS, host: string) => {
  const jobPlan = generateJobPlan(ns, host);
  const jobsWithThreads = jobPlan
    .filter((jp) => jp.threads > 0)
    .sort((a, b) => b.time - a.time);

  // we use the sorted jobs, and take the highest running time and add extra safety margin
  const estimatedRunTime =
    jobsWithThreads[0].time +
    (jobsWithThreads.length - 1) * TIME_MARGIN_IN_SECONDS;

  return { jobPlan, estimatedRunTime };
};

export const getHackingHosts = (ns: NS) => {
  return discoverHosts(ns).filter((host) => {
    const hasRoot = ns.hasRootAccess(host);
    const info = hostInfo(ns, host);

    return hasRoot && info.hc >= 70;
  });
};

export const resourceManager = async (ns: NS) => {
  const hosts = getHackingHosts(ns);

  // get existing running batch jobs
  const existingBatchScripts = ns
    .ps(HOME_SERVER)
    .reduce((result: string[], script) => {
      if (script.filename === SCRIPT_BATCH_JOB) {
        result.push(`${script.args[0]}`);
      }
      return result;
    }, []);

  for (const host of hosts) {
    if (!existingBatchScripts.includes(host)) {
      ns.exec(SCRIPT_BATCH_JOB, HOME_SERVER, 1, host);
      log(ns, `batch: host:${host}`);
    }
  }
};

export const batchJobs = async (
  ns: NS,
  jobPlan: JobPlan[],
  targetHost: string
) => {
  const startDate = new Date();

  const [initialWeaken, growCash, growWeaken, hack, hackWeaken] = jobPlan;
  log(ns, "full batch start");

  // for now, wait until the initial weaken is accomplished.
  await execJob({
    ns,
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
    targetHost,
    scriptName: getScriptToRun(sortedJobPlan[0].type),
    threads: sortedJobPlan[0].threads,
  });

  const job2Time = sortedJobPlan[0].time - sortedJobPlan[1].time;
  await execJob({
    ns,
    targetHost,
    scriptName: getScriptToRun(sortedJobPlan[1].type),
    threads: sortedJobPlan[1].threads,
    waitTime:
      sortedJobPlan[0].threads > 0 ? TIME_MARGIN_IN_SECONDS + job2Time : -1,
  });

  const job3Time = job2Time + (sortedJobPlan[1].time - sortedJobPlan[2].time);
  await execJob({
    ns,
    targetHost,
    scriptName: getScriptToRun(sortedJobPlan[2].type),
    threads: sortedJobPlan[2].threads,
    waitTime:
      sortedJobPlan[1].threads > 0 ? TIME_MARGIN_IN_SECONDS + job3Time : -1,
  });

  const job4Time = job3Time + (sortedJobPlan[2].time - sortedJobPlan[3].time);
  await execJob({
    ns,
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

type PrepareServerProps = {
  ns: NS;
  host: string;
};
/**
 * Slowly increases the host money while keeping security to a minimum
 * @param ns
 * @param host
 */
export const prepareServer = async ({ ns, host }: PrepareServerProps) => {
  let weakenThreads = calcWeakenThreads(ns, host);
  while (weakenThreads) {
    const weakenTime = ns.getWeakenTime(host) / 1000;
    await execJob({
      ns,
      targetHost: host,
      scriptName: getScriptToRun("weaken"),
      threads: weakenThreads,
      waitTime: weakenTime + TIME_MARGIN_IN_SECONDS,
      allThreads: false,
    });

    weakenThreads = calcWeakenThreads(ns, host);
  }

  const growThreads = calculateThreadsGrow({ ns, host });
  if (growThreads) {
    const growTime = ns.getGrowTime(host) / 1000;
    await execJob({
      ns,
      targetHost: host,
      scriptName: getScriptToRun("grow"),
      threads: growThreads,
      waitTime: growTime + TIME_MARGIN_IN_SECONDS,
    });
  }

  const weaknThreadsLeft = calcWeakenThreads(ns, host);
  if (weaknThreadsLeft) {
    log(ns, `weaknThreadsLeft:${weaknThreadsLeft}, starting a new loop`);
    await prepareServer({ ns, host });
  }
};

/**
 * Precision here is key.
 * Fined tuned controlled hack
 */
export const batchHack = async ({ ns, host }: { ns: NS; host: string }) => {
  await prepareServer({ ns, host });
};
