import { NS } from "@ns";
import { log } from "lib/lib-log";
import {
  requestExecScript,
  MessagePayload,
  getThreadsAvailable,
  ThreadsAvailable,
  ExecPlan,
  ThreadMap,
} from "/lib/lib-threads";
import { SCRIPT_EXEC_REQUEST_PORT } from "/constants";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  const portHandleExecRequests = ns.getPortHandle(SCRIPT_EXEC_REQUEST_PORT);
  const reservedThreadsMap: {
    [key: string]: {
      threadsReserved: number;
      executionTime: number;
    }[];
  } = {};

  const parseTheadsAvailableWithReserved = (
    threadsAvailable: ThreadsAvailable
  ): ThreadsAvailable => {
    let parsedTotalTheads = 0;
    const parsedThreadMap: ThreadMap = {};
    const currentThreadMap = threadsAvailable[1];

    Object.entries(currentThreadMap).forEach(([host, hostAvailableThreads]) => {
      let hostReservedThreads = 0;

      // find threads already reserved in this host
      if (host in reservedThreadsMap) {
        hostReservedThreads = reservedThreadsMap[host].reduce(
          (res, { threadsReserved }) => {
            return res + threadsReserved;
          },
          0
        );
      }

      const parsedAvailableThreads = hostAvailableThreads - hostReservedThreads;
      parsedThreadMap[host] = parsedAvailableThreads;
      parsedTotalTheads += parsedAvailableThreads;
    });

    return [parsedTotalTheads, parsedThreadMap];
  };

  while (true) {
    if (!portHandleExecRequests.empty()) {
      const message: MessagePayload = JSON.parse(
        portHandleExecRequests.read().toString()
      );
      // log(ns, "msg received");
      // log(ns, JSON.stringify(message));

      const threadsAvailable = getThreadsAvailable(ns, message.script);
      const threadsData = parseTheadsAvailableWithReserved(threadsAvailable);
      // log(ns, "threadsAvailable");
      // log(ns, JSON.stringify(threadsAvailable, null, 1));

      log(ns, "threadsData");
      log(ns, JSON.stringify(threadsData, null, 1));

      const [executionTime, executionPlan] = requestExecScript(
        ns,
        message,
        threadsData
      );

      // add execution plan, to reserved theadsMap
      executionPlan?.forEach((execPlan: ExecPlan) => {
        const { host, threadsUsed } = execPlan;

        if (!(host in reservedThreadsMap)) {
          reservedThreadsMap[host] = [];
        }

        reservedThreadsMap[host].push({
          threadsReserved: threadsUsed,
          executionTime,
        });
      });
    }

    // cleanup reversed threads based on time.
    Object.entries(reservedThreadsMap).forEach(([host, list]) => {
      list.every((value, index) => {
        reservedThreadsMap[host][index].executionTime -= 1;
      });

      reservedThreadsMap[host] = list.filter(
        ({ executionTime }) => executionTime > 0
      );

      if (reservedThreadsMap[host].length === 0) {
        delete reservedThreadsMap[host];
      }
    });

    // log(ns, "reservedThreadsMap");
    // log(ns, JSON.stringify(reservedThreadsMap));

    await ns.sleep(1_000);
  }
}
