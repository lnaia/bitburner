import { NS } from "@ns";
import { buyNode, upgradeNodesCheapestUpgradeFirst } from "lib/lib-shop-nodes";
import { log } from "lib/lib-log";
import type { StatusReport } from "typings";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();

  const logPositiveStatus = (status: StatusReport) => {
    if (status[0]) {
      log(ns, `${status[1]}`);
    }
  };

  log(ns, "started");

  const ONE_SECOND = 1000;
  while (true) {
    upgradeNodesCheapestUpgradeFirst(ns);
    logPositiveStatus(buyNode(ns));
    await ns.sleep(ONE_SECOND);
  }
}
