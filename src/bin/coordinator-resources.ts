import { NS } from "@ns";
import { resourceManager } from "lib/lib-resources";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  while (true) {
    await resourceManager(ns);
    await ns.sleep(10_000);
  }
}
