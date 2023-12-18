import { NS } from "@ns";
import {
  batchJobs,
  resourceManagerSingleHost,
  prepareServer,
} from "lib/lib-resources";
import { log } from "lib/lib-log";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  // ns.tail();
  const targetHost = ns.args[0].toString();

  await prepareServer(ns, targetHost);
  log(ns, `server prepared successfully.`);

  while (true) {
    const { estimatedRunTime, jobPlan } = resourceManagerSingleHost(
      ns,
      targetHost
    );

    log(
      ns,
      `Start: estimatedRunTime:${estimatedRunTime} targetHost:${targetHost}`
    );
    await batchJobs(ns, jobPlan, targetHost);
    await ns.sleep(1000);
  }
}
