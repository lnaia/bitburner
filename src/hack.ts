import type {NS} from './NetscriptDefinitions';

export async function main(ns: NS) {
  const host = `${ns.args[0]}`;
  const moneyThresh = ns.getServerMaxMoney(host) * 0.75;
  const securityThresh = ns.getServerMinSecurityLevel(host) + 5;

  while (true) {
    if (ns.getServerSecurityLevel(host) > securityThresh) {
      await ns.weaken(host);
    } else if (ns.getServerMoneyAvailable(host) < moneyThresh) {
      await ns.grow(host);
    } else {
      await ns.hack(host);
    }
  }
}
