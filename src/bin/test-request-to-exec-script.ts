import { NS } from "@ns";
import { MessagePayload } from "/lib/lib-threads";
import { SCRIPT_EXEC_REQUEST_PORT, SCRIPT_GROW } from "/constants";
import { calculateThreadsGrow } from "/lib/lib-grow";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.clearLog();
  ns.tail();

  const portHandle = ns.getPortHandle(SCRIPT_EXEC_REQUEST_PORT);
  const targetHost = "foodnstuff";
  const message: MessagePayload = {
    targetHost,
    script: SCRIPT_GROW,
    scriptType: "grow",
    threads: calculateThreadsGrow({ ns, host: targetHost }),
  };
  const payload = JSON.stringify(message);

  while (!portHandle.tryWrite(payload)) {
    await ns.sleep(1_000);
  }
  ns.print("message sent");
}
