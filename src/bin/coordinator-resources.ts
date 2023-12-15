import { NS } from "@ns";
import { resourceManager } from "lib/lib-resources";

export async function main(ns: NS) {
  ns.clearLog();
  ns.tail();

  await resourceManager(ns);
}
