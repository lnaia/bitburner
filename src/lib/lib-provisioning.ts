import { NS } from "@ns";
import { discoverHosts } from "/lib/lib-discover-hosts";
import { SCRIPT_GROW, SCRIPT_HACK, SCRIPT_WEAKEN } from "/constants";
import { log } from "/lib/lib-log";

export const provisionHost = (ns: NS, host: string) => {
  for (const script of [SCRIPT_HACK, SCRIPT_GROW, SCRIPT_WEAKEN]) {
    if (ns.fileExists(script, host)) {
      ns.rm(script, host);
    }

    log(ns, `provisioning ${host} with ${script}`);
    ns.scp(script, host, "home");
  }
};

export const provision = (ns: NS) => {
  const hosts = discoverHosts(ns).filter((host) => ns.hasRootAccess(host));
  const ownServers = ns.getPurchasedServers();
  for (const host of [...hosts, ...ownServers]) {
    provisionHost(ns, host);
  }
};
