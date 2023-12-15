import { NS } from "@ns";
import { monitorHosts } from "lib/lib-monitor-hosts";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.tail();

  const [maxHosts, sortOrder, invert, name] = ns.args;

  while (true) {
    monitorHosts({
      ns,
      maxHosts: maxHosts ? +maxHosts : -1,
      sortOrder: `${sortOrder ? sortOrder : ""}`,
      invert: Boolean(invert),
      name: `${name ? name : ""}`,
    });

    await ns.sleep(1000);
  }
}
