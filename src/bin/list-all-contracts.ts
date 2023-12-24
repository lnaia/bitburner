import { NS } from "@ns";
import { buyServer, upgradeServers } from "lib/lib-shop-servers";
import { buyNode, upgradeNodes } from "lib/lib-shop-nodes";
import { autoRootHosts } from "lib/lib-auto-root-hosts";
import { log } from "lib/lib-log";
import type { StatusReport } from "typings";
import { provision } from "/lib/lib-provisioning";
import { discoverHosts } from "/lib/lib-discover-hosts";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();

  const hosts = discoverHosts(ns, false);
  const contracts: { [key: string]: string[] } = {};
  for (const host of hosts) {
    const files = ns.ls(host, "cct").filter((file) => file.length);

    if (files.length) {
      contracts[host] = files;
    }
  }

  ns.tprint(JSON.stringify(contracts, null, 2));
}
