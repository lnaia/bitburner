import { NS } from "@ns";
import { toggleHomeUsage } from "/lib/lib-use-home-server";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();
  toggleHomeUsage(ns);
}
