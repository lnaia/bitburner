import { NS } from "@ns";
import { batchJobs } from "lib/lib-resources";
import { log } from "/lib/lib-log";

export async function main(ns: NS) {
  const targetHost = ns.args[0].toString();
  const jobPlan = JSON.parse(ns.args[1].toString());
  const estimatedRunTime = ns.args[2].toString();

  log(ns, `estimatedRunTime:${estimatedRunTime} targetHost:${targetHost}`);
  while (true) {
    await batchJobs(ns, jobPlan, targetHost);
    await ns.sleep(+estimatedRunTime * 1000);
  }
}
