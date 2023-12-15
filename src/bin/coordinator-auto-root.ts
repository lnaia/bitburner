import { NS } from "@ns";
import { autoRootHosts } from "lib/lib-auto-root-hosts";
import { log } from "lib/lib-log";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();

  log(ns, "started");

  const ONE_SECOND = 1000;
  while (true) {
    autoRootHosts(ns);

    await ns.sleep(ONE_SECOND);
  }
}
