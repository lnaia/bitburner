import { prepareServer, maxHack } from "lib/lib-resources";
import { NS } from "@ns";

type Props = {
  ns: NS;
  host: string;
};

export const cycleHackHost = async ({ ns, host }: Props) => {
  while (true) {
    await prepareServer(ns, host);
    await maxHack(ns, host);

    await ns.sleep(1_000);
  }
};
