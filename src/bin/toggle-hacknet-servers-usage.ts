import { NS } from "@ns";
import { toggleHacknetServersUsage } from "/lib/lib-use-hacknet-servers";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();
  toggleHacknetServersUsage(ns);
}
