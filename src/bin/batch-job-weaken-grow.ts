import { NS } from "@ns";
import { calcWeakenThreads, stopConditionWeaken } from "lib/lib-weaken";
import { stopConditionGrow } from "lib/lib-grow";
import { JobPlan } from "/lib/lib-hack";
import { log } from "/lib/lib-log";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  const targetHost = ns.args[0].toString();

  const isHostWeak = stopConditionWeaken(ns, targetHost);
  const weakThreads = calcWeakenThreads(ns, targetHost);

  // const threadsAvailable =
}
