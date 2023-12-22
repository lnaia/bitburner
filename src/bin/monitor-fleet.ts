import { NS } from "@ns";
import { generateReport } from "/lib/lib-monitor-fleet";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.tail();

  while (true) {
    const { hosts, ramDetails, threads } = generateReport(ns);
    ns.clearLog();
    ns.print(
      JSON.stringify(
        {
          hosts,
          ramDetails,
          threads,
        },
        null,
        2
      )
    );

    await ns.sleep(500);
  }
}
