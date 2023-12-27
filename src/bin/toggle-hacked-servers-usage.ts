import { NS } from "@ns";
import { toggleHackedServers } from "lib/lib-use-hacked-servers";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();
  toggleHackedServers(ns);
}
