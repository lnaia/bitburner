import { NS } from "@ns";
import { calcWeakenThreads } from "lib/lib-weaken";
import { calculateThreadsGrow } from "lib/lib-grow";

const toSeconds = (input: number): number => {
  return Math.ceil(input / 1000);
};

export type JobPlan = {
  type: "weaken" | "grow" | "hack";
  threads: number;
  time: number;
  desc: string;
};
export const generateJobPlan = (ns: NS, host: string): JobPlan[] => {
  const initialWeaken: JobPlan = {
    type: "weaken",
    threads: calcWeakenThreads(ns, host),
    time: toSeconds(ns.getWeakenTime(host)),
    desc: "initialWeaken",
  };

  // only take 10% of current money, less threads, no need to be greedy.
  const moneyThatWillBeStolen = ns.getServerMoneyAvailable(host) * 0.1;
  const requiredThreadsGrow = calculateThreadsGrow({
    ns,
    host,
    moneyThatWillBeStolen,
  });

  const growCash: JobPlan = {
    type: "grow",
    threads: requiredThreadsGrow,
    time: toSeconds(ns.getGrowTime(host)),
    desc: "growCash",
  };

  const securityIncreaseAfterGrow = ns.growthAnalyzeSecurity(
    requiredThreadsGrow,
    host
  );

  const weakenAfterGrow: JobPlan = {
    type: "weaken",
    threads: calcWeakenThreads(ns, host, securityIncreaseAfterGrow),
    time: toSeconds(ns.getWeakenTime(host)),
    desc: "weakenAfterGrow",
  };

  const requiredHackThreads = Math.ceil(
    ns.hackAnalyzeThreads(host, moneyThatWillBeStolen)
  );
  const hackCash: JobPlan = {
    type: "hack",
    threads: requiredHackThreads,
    time: toSeconds(ns.getHackTime(host)),
    desc: "hackCash",
  };

  const securityIncreaseAfterHack = ns.hackAnalyzeSecurity(
    requiredHackThreads,
    host
  );
  const requiredWeakenThreads = calcWeakenThreads(
    ns,
    host,
    securityIncreaseAfterHack
  );

  const weakenAfterHack: JobPlan = {
    type: "weaken",
    threads: requiredWeakenThreads,
    time: toSeconds(ns.getWeakenTime(host)),
    desc: "weakenAfterHack",
  };

  return [initialWeaken, growCash, weakenAfterGrow, hackCash, weakenAfterHack];
};

export const generateWeakenGrowJobPlan = (
  ns: NS,
  host: string,
  maxThreads: number
): JobPlan[] => {
  const [initialWeaken, growCash, weakenAfterGrow] = generateJobPlan(ns, host);
  return [initialWeaken, growCash, weakenAfterGrow].map((plan) => {
    return {
      ...plan,
      threads: plan.threads > maxThreads ? maxThreads : plan.threads,
    };
  });
};
