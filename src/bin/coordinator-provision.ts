import { NS } from "@ns";
import { provision } from "/lib/lib-provisioning";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();

  while (true) {
    provision(ns);
    await ns.sleep(1_000);
  }
}
