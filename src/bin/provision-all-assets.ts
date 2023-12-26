import { NS } from "@ns";
import { provision } from "/lib/lib-provisioning";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();

  provision(ns);
}
