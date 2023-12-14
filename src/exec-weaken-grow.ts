import type {NS} from './NetscriptDefinitions';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.clearLog();
  const [host] = `${ns.args[0]}`;

  const weakenServer = async () => {
    const minSecurity = ns.getServerMinSecurityLevel(host);
    let currSecurity = ns.getServerSecurityLevel(host);
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
