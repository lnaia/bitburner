import type {NS} from './NetscriptDefinitions';

export const calculateThreadsGrow = (ns: NS, host: string) => {
  ns.disableLog('ALL');
  const maxMoney = ns.getServerMaxMoney(host);
  let currMoney = ns.getServerMoneyAvailable(host);
  if (currMoney <= 0) {
    currMoney = 1;
  }

  let factor = 1;
  try {
    factor = Math.ceil(maxMoney / currMoney);
  } catch (e) {
    // ignore
    factor = 1;
  }

  return Math.ceil(ns.growthAnalyze(host, factor));
};

export async function main(ns: NS) {
  ns.clearLog();
  ns.tail();
  const host = ns.args[0].toString();

  const weakenServer = async () => {
    const minSecurity = ns.getServerMinSecurityLevel(host);
    let currSecurity = Math.floor(ns.getServerSecurityLevel(host));
    while (currSecurity > minSecurity) {
      await ns.weaken(host);
      currSecurity = ns.getServerSecurityLevel(host);
      await ns.sleep(1000);
    }
  };

  await weakenServer();
  const maxMoney = ns.getServerMaxMoney(host);
  let currMoney = ns.getServerMoneyAvailable(host);
  while (currMoney < maxMoney) {
    await ns.grow(host);
    currMoney = ns.getServerMoneyAvailable(host);
    await weakenServer();
    await ns.sleep(1000);
  }
}
