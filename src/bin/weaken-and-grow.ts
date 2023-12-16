import { NS } from "@ns";
import { HOME_SERVER, SCRIPT_BATCH_JOB_WEAKEN_GROW } from "constants";
import { discoverHosts } from "/lib/lib-discover-hosts";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  const targetHost = ns.args[0] ?? "";
  const sequence = (targetHost: string) => {
    ns.exec(SCRIPT_BATCH_JOB_WEAKEN_GROW, HOME_SERVER, 1, targetHost);
  };

  if (targetHost) {
    await sequence(`${targetHost}`);
  } else {
    const hosts = discoverHosts(ns).filter((host) => ns.hasRootAccess(host));
    for (const host of hosts) {
      await sequence(host);
    }
  }
}
