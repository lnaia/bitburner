import { NS } from "@ns";
import { MessagePayload } from "lib/lib-threads";
import { SCRIPT_EXEC_REQUEST_PORT, SCRIPT_GROW } from "constants";
import { calculateThreadsGrow } from "lib/lib-grow";
import { sendMessages } from "lib/lib-messages";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  const targetHost = "foodnstuff";
  const message: MessagePayload = {
    targetHost,
    script: SCRIPT_GROW,
    threads: calculateThreadsGrow({ ns, host: targetHost }),
  };
  await sendMessages(ns, message, SCRIPT_EXEC_REQUEST_PORT);
  ns.print("message sent");
}
