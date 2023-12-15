import { NS } from "@ns";
import { previsions } from "lib/lib-previsions";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  await previsions(ns);
}
