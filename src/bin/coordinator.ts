import { NS } from "@ns";
import { buyServer, upgradeServers } from "lib/lib-shop-servers";
import { buyNode, upgradeNodes } from "lib/lib-shop-nodes";
import { autoRootHosts } from "lib/lib-auto-root-hosts";
import { log } from "lib/lib-log";
import type { StatusReport } from "typings";
import { provision } from "/lib/lib-provisioning";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();

  const ONE_SECOND = 1000;
  while (true) {
    await ns.sleep(ONE_SECOND);
  }
}
