import { NS } from "@ns";
import { cycleHackHost } from "/lib/lib-cycle-algorythm";
import { HOME_SERVER, SCRIPT_MONITOR_HOST } from "/constants";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  const targetHost = ns.args[0].toString();

  ns.exec(SCRIPT_MONITOR_HOST, HOME_SERVER, 1, targetHost);

  while (true) {
    await cycleHackHost({ ns, host: targetHost });
    await ns.sleep(1000);
  }
}
