import { NS } from "@ns";
import { log } from "./lib-log";
import { calcWeakenThreads } from "./lib-weaken";

const LIMIT_MAX_MONEY_PERCENT = 0.99;

const toSeconds = (input: number): number => {
  return Math.ceil(input / 1000);
};

const calculateThreadsGrow = (
  ns: NS,
  host: string,
  maxPercent = LIMIT_MAX_MONEY_PERCENT
) => {
  const maxMoney = ns.getServerMaxMoney(host) * maxPercent;
  let currMoney = ns.getServerMoneyAvailable(host);
  if (currMoney <= 0) {
    currMoney = 1;
  }

  let factor = 1;
  try {
    factor = Math.ceil(maxMoney / currMoney);
  } catch (e) {
    // ignore
    factor = 1;
  }

  return Math.ceil(ns.growthAnalyze(host, factor));
};

type JobPlan = {
  type: "weaken" | "grow" | "hack";
  threads: number;
  time: number;
  description?: string;
};
export const generateJobPlan = (ns: NS, host: string): JobPlan[] => {
  const jobPlan: JobPlan[] = [];

  (() => {
    const requiredWeakenThreads = calcWeakenThreads(ns, host);
    jobPlan.push({
      type: "weaken",
      threads: requiredWeakenThreads,
      time: toSeconds(ns.getWeakenTime(host) * requiredWeakenThreads),
      description: "initial",
    });
  })();

  const requiredThreadsGrow = calculateThreadsGrow(ns, host);
  jobPlan.push({
    type: "grow",
    threads: requiredThreadsGrow,
    time: toSeconds(ns.getGrowTime(host)),
    description: "grow currency",
  });

  (() => {
    const securityIncreaseAfterGrow = ns.growthAnalyzeSecurity(
      requiredThreadsGrow,
      host
    );
    const requiredWeakenThreads = calcWeakenThreads(
      ns,
      host,
      securityIncreaseAfterGrow
    );

    jobPlan.push({
      type: "weaken",
      threads: requiredWeakenThreads,
      time: toSeconds(ns.getWeakenTime(host) * requiredWeakenThreads),
      description: "after sec inc due to growth ",
    });
  })();

  const currMoney = ns.getServerMoneyAvailable(host) * 0.1; // only take 10% of current money, less threads, no need to be greedy.
  const requiredHackThreads = Math.ceil(ns.hackAnalyzeThreads(host, currMoney));
  if (requiredHackThreads === -1) {
    log(
      ns,
      "hack threads, hackAmount is less than zero or greater than the amount of money available on the server"
    );
  } else {
    jobPlan.push({
      type: "hack",
      threads: requiredHackThreads,
      time: toSeconds(ns.getHackTime(host) * requiredHackThreads),
      description: "steal currency",
    });
  }

  (() => {
    const securityIncreaseAfterHack = ns.hackAnalyzeSecurity(
      requiredHackThreads,
      host
    );
    const requiredWeakenThreads = calcWeakenThreads(
      ns,
      host,
      securityIncreaseAfterHack
    );

    jobPlan.push({
      type: "weaken",
      threads: requiredWeakenThreads,
      time: toSeconds(ns.getWeakenTime(host) * requiredWeakenThreads),
      description: "after security inc due to hack",
    });
  })();

  return jobPlan;
};

/*
[
  {type: 'weaken', threads: 0,   time: 0,    description: 'initial'},
  {type: 'grow',   threads: 29,  time: 44,   description: 'grow currency'},
  {type: 'weaken', threads: 3,   time: 164,  description: 'after sec inc due to growth '},
  {type: 'hack',   threads: 219, time: 2991, description: 'steal currency'},
  {type: 'weaken', threads: 9,   time: 492,  description: 'after security inc due to hack'},
];

1, spawn hack, que demora 3875s
2, spawn weaken, q demora 637s, qd faltar 640s no hack, 3s de margem
3, spawn weaken, q demora 213 segundos, qd faltar 216s no 1 e no 2
4, spawn grow, q demora 57 segundos, qd faltar 60s nos anteriores

resultado:

primeiro bate o 4, dps bate o 3, dps bate o 2, dps bate o 1

resource usage:

durante 3875-640s, esta bloqueado com 219 threads a fazer o hack
durante 640-216, esta bloquead com 219 + 9
durante 216-213, esta bloqueado com 219 + 9 + 3
durante 60-57, esta bloqueado com 219 + 9 + 3 + 29
*/
