import { NS } from "@ns";
import { hardenServer, maxHack, prepareServer } from "lib/lib-resources";
import { calcWeakenThreads } from "lib/lib-weaken";
import { sendMessages } from "lib/lib-messages";
import { calculateThreadsGrow } from "lib/lib-grow";
import { getExistingBatchScripts } from "lib/lib-hosts";

export const stockManager = async (ns: NS) => {
  const host = "megacorp";
  const stockSymbol = "MGCP";

  ns.print("price start: " + ns.stock.getPrice(stockSymbol));
  await prepareServer(ns, host);
  ns.print("host prepared");
  await maxHack(ns, host);
  ns.print("price end: " + ns.stock.getPrice(stockSymbol));

  // buy order then... prepare to sell:
  // await hardenServer(ns, host);
  ns.print("the end");
};
