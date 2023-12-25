import { printObjList } from "helper";
import { discoverHosts } from "lib/lib-discover-hosts";
import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  const hosts = discoverHosts(ns, false);
  const hostfiles = hosts.reduce((res: { [key: string]: string[] }, host) => {
    if (!(host in res)) {
      res[host] = [];
    }

    ns.ls(host).forEach((file) => {
      if (!/hacks\/*/.test(file)) {
        res[host].push(file);
      }
    });

    return res;
  }, {});

  ns.print(JSON.stringify(hostfiles, null, 2));
}
