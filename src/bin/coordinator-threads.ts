import { NS } from "@ns";
import {
  ThreadsReservedMap,
  threadManager,
  manageThreadReservedTime,
} from "/lib/lib-threads";
import { readMessageExecScript } from "/lib/lib-messages";
import { log } from "/lib/lib-log";

const cheapClone = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  let reservedThreads: ThreadsReservedMap = {};

  while (true) {
    const message = readMessageExecScript(ns);
    if (message) {
      const { targetHost, script, threads } = message.payload;
      const { reservedThreads: newReservedThreads } = threadManager({
        ns,
        targetHost: `${targetHost}`,
        script: `${script}`,
        threads: +threads,
        reservedThreads: cheapClone(reservedThreads),
      });

      reservedThreads = cheapClone(newReservedThreads);
    }

    reservedThreads = cheapClone(manageThreadReservedTime({ reservedThreads }));
    log(ns, "reservedThreadsMap");
    log(ns, JSON.stringify(reservedThreads, null, 1));

    await ns.sleep(1_000);
  }
}
