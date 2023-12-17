import { NS } from "@ns";
import { JobPlan } from "lib/lib-hack";

export const sendMessages = async (ns: NS, message: any, port: number) => {
  const payload = JSON.stringify(message);
  const portHandle = ns.getPortHandle(port);

  while (!portHandle.tryWrite(payload)) {
    await ns.sleep(1_000);
  }
};

export const listenForMessage = async (
  ns: NS,
  type: string,
  port: number
): Promise<unknown> => {
  const portHandle = ns.getPortHandle(port);

  while (true) {
    if (!portHandle.empty()) {
      const message: { type: string; host: string } = JSON.parse(
        portHandle.read().toString()
      );

      if (message.type === type) {
        return message;
      } else {
        // not the right time of message, back in the queue.
        await sendMessages(ns, message, port);
      }
    }
    await ns.sleep(1000);
  }
};
