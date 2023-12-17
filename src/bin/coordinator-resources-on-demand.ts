import { NS } from "@ns";
import { resourceManager } from "lib/lib-resources";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();

  while (true) {
    resourceManager(ns);
    await ns.sleep(1_0000);
  }
}
