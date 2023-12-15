import { NS } from "@ns";
import { log } from "lib/lib-log";
import { calcWeakenThreads } from "lib/lib-weaken";
import { calculateThreadsGrow } from "lib/lib-grow";

const toSeconds = (input: number): number => {
  return Math.ceil(input / 1000);
};

type JobPlan = {
  type: "weaken" | "grow" | "hack";
  threads: number;
  time: number;
};
export const generateJobPlan = (ns: NS, host: string): JobPlan[] => {
  const jobPlan: JobPlan[] = [
    // initial weaken
    {
      type: "weaken",
      threads: calcWeakenThreads(ns, host),
      time: toSeconds(ns.getWeakenTime(host)),
    },
  ];

  // grow currency
  const requiredThreadsGrow = calculateThreadsGrow(ns, host);
  jobPlan.push({
    type: "grow",
    threads: requiredThreadsGrow,
    time: toSeconds(ns.getGrowTime(host)),
  });

  const securityIncreaseAfterGrow = ns.growthAnalyzeSecurity(
    requiredThreadsGrow,
    host
  );
  jobPlan.push({
    type: "weaken",
    threads: calcWeakenThreads(ns, host, securityIncreaseAfterGrow),
    time: toSeconds(ns.getWeakenTime(host)),
    // description: "weaken after sec inc due to growth ",
  });

  const currMoney = ns.getServerMoneyAvailable(host) * 0.1; // only take 10% of current money, less threads, no need to be greedy.
  const requiredHackThreads = Math.ceil(ns.hackAnalyzeThreads(host, currMoney));
  if (requiredHackThreads === -1) {
    log(
      ns,
      "hack threads, hackAmount is less than zero or greater than the amount of money available on the server"
    );
  } else {
    // hack existing cash
    jobPlan.push({
      type: "hack",
      threads: requiredHackThreads,
      time: toSeconds(ns.getHackTime(host)),
    });
  }

  const securityIncreaseAfterHack = ns.hackAnalyzeSecurity(
    requiredHackThreads,
    host
  );
  const requiredWeakenThreads = calcWeakenThreads(
    ns,
    host,
    securityIncreaseAfterHack
  );
  // after security inc due to hack
  jobPlan.push({
    type: "weaken",
    threads: requiredWeakenThreads,
    time: toSeconds(ns.getWeakenTime(host)),
  });

  return jobPlan;
};
