import { NS } from "@ns";

export async function main(ns: NS) {
  const [pid] = ns.args;

  const startDate = new Date();
  while (ns.isRunning(+pid)) {
    await ns.sleep(100);
  }
  const endDate = new Date();

  const msg = `pid:${pid} ran for ${
    (endDate.getTime() - startDate.getTime()) / 1000
  } seconds`;

  ns.print(msg);
  ns.tprint(msg);
}
