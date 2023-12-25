import { NS } from "@ns";
import { stockManager } from "/lib/lib-stocks";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  await stockManager(ns);

  // const stocks = true;
  // const threads = 2;
  // const pid = ns.exec(
  //   SCRIPT_HACK,
  //   HOME_SERVER,
  //   threads,
  //   "megacorp",
  //   threads,
  //   stocks
  // );
  // ns.tprint(`running pid: ${pid}`);
}
