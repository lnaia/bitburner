import { NS } from "@ns";
import { sendMessages } from "lib/lib-messages";
import {
  MESSAGE_TYPE,
  SCRIPT_GROW,
  SCRIPT_HACK,
  SCRIPT_WEAKEN,
} from "constants";
import { calcWeakenThreads } from "lib/lib-weaken";
import { calculateThreadsGrow } from "/lib/lib-grow";

export async function main(ns: NS) {
  const targetHost = "n00dles";

  await sendMessages(ns, {
    type: MESSAGE_TYPE.MESSAGE_TYPE_EXEC_SCRIPT,
    payload: {
      targetHost,
      // weaken everything
      script: SCRIPT_WEAKEN,
      threads: calcWeakenThreads(ns, targetHost),

      // grow everything
      // script: SCRIPT_GROW,
      // threads: calculateThreadsGrow({ ns, host: targetHost }),

      // hack everything
      // script: SCRIPT_HACK,
      // threads: Math.ceil(
      //   ns.hackAnalyzeThreads(
      //     targetHost,
      //     ns.getServerMoneyAvailable(targetHost)
      //   )
      // ),
    },
  });
}
