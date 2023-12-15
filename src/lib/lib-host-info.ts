import { humanReadableMoney } from "helper";
import { NS } from "@ns";
import type { HostDetails } from "typings";

export const hostInfo = (ns: NS, host: string): HostDetails => {
  const moneyMax = ns.getServerMaxMoney(host);
  const moneyCurrent = ns.getServerMoneyAvailable(host);
  const percentDiff = (100 - (moneyCurrent * 100) / moneyMax).toFixed(4);

  return {
    host,
    mm: moneyMax,
    hmm: humanReadableMoney(moneyMax),
    cm: moneyCurrent,
    hcm: humanReadableMoney(moneyCurrent),
    diff: percentDiff,
    ms: Math.round(ns.getServerMinSecurityLevel(host)),
    cs: Math.round(ns.getServerSecurityLevel(host)),
    rh: Math.round(ns.getServerRequiredHackingLevel(host)),
    hc: +(ns.hackAnalyzeChance(host) * 100).toFixed(2),
  };
};
