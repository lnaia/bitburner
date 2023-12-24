import { printObjList } from "helper";
import { discoverHosts } from "lib/lib-discover-hosts";
import { NS } from "@ns";

/** @param {NS} ns */
export async function main(ns: NS) {
  const hosts = discoverHosts(ns, false);
  ns.tprint(JSON.stringify(hosts, null, 2));
}
