import { NS } from "@ns";
import { discoverHosts } from "/lib/lib-discover-hosts";
import { SCRIPT_GROW, SCRIPT_HACK, SCRIPT_WEAKEN } from "/constants";
import { log } from "/lib/lib-log";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  const hosts = discoverHosts(ns).filter((host) => ns.hasRootAccess(host));
  const ownServers = ns.getPurchasedServers();
  for (const host of [...hosts, ...ownServers]) {
    log(ns, `provisioning ${host}`);
    for (const script of [SCRIPT_HACK, SCRIPT_GROW, SCRIPT_WEAKEN]) {
      if (ns.fileExists(script, host)) {
        ns.rm(script, host);
      }

      ns.scp(script, host, "home");
    }
  }
}
