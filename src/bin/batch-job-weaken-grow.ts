import { NS } from "@ns";
import { batchJobsWeakenGrow } from "lib/lib-resources";
import { log } from "/lib/lib-log";
import { stopConditionWeaken } from "lib/lib-weaken";
import { stopConditionGrow } from "lib/lib-grow";
import { JobPlan } from "/lib/lib-hack";

export async function main(ns: NS) {
  const targetHost = ns.args[0].toString();
  let jobPlan: JobPlan[] = JSON.parse(ns.args[1].toString());
  let isServerWeak = stopConditionWeaken(ns, targetHost);
  let isServerGrown = stopConditionGrow(ns, targetHost);
  const maxThreads = jobPlan[0].threads;

  while (!isServerWeak || !isServerGrown) {
    // maxthreads is the same for all
    // we might hit peak at different times, no need to waste threads
    jobPlan = jobPlan.map((plan) => {
      if (plan.type === "weaken") {
        plan.threads = isServerWeak ? 0 : maxThreads;
      }

      if (plan.type === "grow") {
        plan.threads = isServerGrown ? 0 : maxThreads;
      }

      return plan;
    });

    await batchJobsWeakenGrow(ns, jobPlan, targetHost);
    isServerWeak = stopConditionWeaken(ns, targetHost);
    isServerGrown = stopConditionGrow(ns, targetHost);

    await ns.sleep(1000);
  }
}
