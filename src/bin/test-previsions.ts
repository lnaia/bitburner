import { NS } from "@ns";
import { previsions } from "lib/lib-previsions";
import { generateJobPlan } from "/lib/lib-hack";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  // await previsions(ns);
  ns.print(JSON.stringify(generateJobPlan(ns, "foodnstuff"), null, 2));
}
