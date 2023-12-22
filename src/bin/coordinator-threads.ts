import { NS } from "@ns";
import {
  ThreadsReservedMap,
  threadManager,
  manageThreadReservedTime,
} from "lib/lib-threads";
import { readMessageExecScript } from "lib/lib-messages";
import { printObjList } from "helper";
import { SCRIPT_RAM_AVERAGE } from "/constants";

const cheapClone = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

export const displayThreads = (ns: NS, reservedThreads: ThreadsReservedMap) => {
  const list = Object.entries(reservedThreads).map(
    ([host, reservedThreads]) => {
      // sorted by time, longest first
      const jobs = reservedThreads.sort((a, b) => {
        return b.executionTime - a.executionTime;
      });

      const totalThreadsReserved = jobs.reduce((res, item) => {
        return res + item.threadsReserved;
      }, 0);

      const maxRam = ns.getServerMaxRam(host);
      const usedRam = ns.getServerUsedRam(host);
      const ramAvailable = maxRam - usedRam;

      const reservedRam = totalThreadsReserved * SCRIPT_RAM_AVERAGE;

      return {
        host,
        "% Ram Reserved": ((reservedRam * 100) / maxRam).toFixed(2),
        "% Ram Free": ((ramAvailable * 100) / maxRam).toFixed(2),
        jobs: jobs.length,
        first: jobs[jobs.length - 1]?.executionTime ?? "",
        last: jobs.length > 1 ? jobs[0]?.executionTime ?? "" : "n/a",
      };
    }
  );

  ns.clearLog();
  const print = ns.print.bind(ns);
  // @ts-expect-error
  printObjList(list, print);
};

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  let reservedThreads: ThreadsReservedMap = {};

  while (true) {
    const message = readMessageExecScript(ns);

    if (message) {
      // log(ns, JSON.stringify(message));
      const { targetHost, script, threads, allThreads } = message.payload;
      const newReservedThreads = threadManager({
        ns,
        targetHost: `${targetHost}`,
        script: `${script}`,
        threads: +threads,
        reservedThreads: cheapClone(reservedThreads),
        allThreads: Boolean(allThreads),
      });

      // log(ns, "newReservedThreads");s
      // log(ns, JSON.stringify(newReservedThreads, null, 1));
      reservedThreads = cheapClone(newReservedThreads);
    }

    reservedThreads = cheapClone(manageThreadReservedTime({ reservedThreads }));
    displayThreads(ns, reservedThreads);
    // log(ns, "reservedThreadsMap");
    // log(ns, JSON.stringify(reservedThreads, null, 1));

    await ns.sleep(1_000);
  }
}
