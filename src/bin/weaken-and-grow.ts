import { NS } from "@ns";
import { calcWeakenThreads, stopConditionWeaken } from "lib/lib-weaken";
import { calculateThreadsGrow, stopConditionGrow } from "lib/lib-grow";
import { HOME_SERVER, SCRIPT_GROW, SCRIPT_WEAKEN } from "constants";

const weakenServer = async (ns: NS, targetHost: string, execHost: string) => {
  while (!stopConditionWeaken(ns, targetHost)) {
    const threads = calcWeakenThreads(ns, targetHost);
    const pid = ns.exec(SCRIPT_WEAKEN, execHost, threads, targetHost);
    while (ns.isRunning(pid)) {
      await ns.sleep(1000);
    }
    await ns.sleep(1000);
  }
};

const growServer = async (ns: NS, targetHost: string, execHost: string) => {
  while (!stopConditionGrow(ns, targetHost)) {
    const threads = calculateThreadsGrow({
      ns,
      host: targetHost,
    });
    const pid = ns.exec(SCRIPT_GROW, execHost, threads, targetHost);
    while (ns.isRunning(pid)) {
      await ns.sleep(1000);
    }
    await ns.sleep(1000);
  }
};

export async function main(ns: NS) {
  ns.clearLog();
  const execHost = HOME_SERVER;
  const targetHost = ns.args[0].toString();

  await weakenServer(ns, targetHost, execHost);
  await growServer(ns, targetHost, execHost);
  await weakenServer(ns, targetHost, execHost);
}
