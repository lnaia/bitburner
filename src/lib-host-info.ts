import {humanReadableMoney} from './lib-human-readable-money';
import type {NS} from './NetscriptDefinitions';
import type {HostDetails} from './typings';

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
    '% diff': percentDiff,
    rh: Math.round(ns.getServerRequiredHackingLevel(host)),
    ms: Math.round(ns.getServerMinSecurityLevel(host)),
    cs: Math.round(ns.getServerSecurityLevel(host)),
    ht: Math.round(ns.getHackTime(host)),
  };
};
