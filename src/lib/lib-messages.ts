import { NS } from "@ns";
import { MESSAGE_TYPE, MESSAGE_PORTS, NO_MESSAGE } from "constants";

type Message = {
  type: keyof typeof MESSAGE_TYPE;
  payload: { [key: string]: string | number };
};
export const sendMessages = async (ns: NS, message: Message) => {
  const portHandle = ns.getPortHandle(MESSAGE_PORTS[message.type]);

  while (!portHandle.tryWrite(JSON.stringify(message))) {
    await ns.sleep(500);
  }
};

export const listenForMessage = async (
  ns: NS,
  type: keyof typeof MESSAGE_TYPE
): Promise<Message> => {
  const portHandle = ns.getPortHandle(MESSAGE_PORTS[type]);

  while (true) {
    if (!portHandle.empty()) {
      const message: Message = JSON.parse(portHandle.read().toString());

      if (message.type === type) {
        return message;
      } else {
        // not the right time of message, back in the queue.
        await sendMessages(ns, message);
      }
    }
    await ns.sleep(1_000);
  }
};

// read the message that exists *now*
// useful when you can't wait for the right message.
export const readMessageExecScript = (ns: NS): Message | null => {
  const portHandle = ns.getPortHandle(
    MESSAGE_PORTS[MESSAGE_TYPE.MESSAGE_TYPE_EXEC_SCRIPT]
  );

  const rawMessage = portHandle.read().toString();
  if (rawMessage === NO_MESSAGE) {
    return null;
  }

  return JSON.parse(rawMessage);
};
