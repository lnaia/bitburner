import { NS } from "@ns";
import { spendHashes } from "/lib/lib-hashes";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  while (true) {
    spendHashes(ns);
    await ns.sleep(1000);
  }
}
