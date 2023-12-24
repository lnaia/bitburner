import { humanReadableMoney } from "helper";
import { NS } from "@ns";
import type { HostDetails } from "typings";
import { getExistingBatchScripts } from "lib/lib-hosts";

export const hostInfo = (ns: NS, host: string): HostDetails => {
  const moneyMax = ns.getServerMaxMoney(host);
  const moneyCurrent = ns.getServerMoneyAvailable(host);
  const percentDiff = (100 - (moneyCurrent * 100) / moneyMax).toFixed(4);
  const existingBatchScripts = getExistingBatchScripts(ns);

  return {
    host,
    mm: moneyMax,
    hmm: humanReadableMoney(moneyMax),
    cm: moneyCurrent,
    hcm: humanReadableMoney(moneyCurrent),
    diff: percentDiff,
    ms: Math.round(ns.getServerMinSecurityLevel(host)),
    cs: ns.getServerSecurityLevel(host).toFixed(2),
    rh: Math.round(ns.getServerRequiredHackingLevel(host)),
    hc: +(ns.hackAnalyzeChance(host) * 100).toFixed(2),
    batchJob: existingBatchScripts.includes(host),
  };
};
