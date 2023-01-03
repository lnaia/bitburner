import {discoverHosts} from './lib-discover-hosts';
import {hostInfo} from './lib-host-info';
import type {NS} from './NetscriptDefinitions';

export async function main(ns: NS) {
  ns.disableLog('getServerMinSecurityLevel');
  ns.disableLog('getServerSecurityLevel');
  ns.disableLog('getServerMaxMoney');
  ns.disableLog('getServerMoneyAvailable');
  ns.disableLog('getServerRequiredHackingLevel');
  ns.disableLog('sleep');

  while (true) {
    const hosts = discoverHosts(ns)
      .map(host => hostInfo(ns, host))
      .filter(host => host.mm > 0)
      .sort((a, b) => b.mm - a.mm);

    const hostsUnderManagement: string[] = [];

    for (const host of hosts) {
      if (!hostsUnderManagement.includes(host.host)) {
        if (ns.hasRootAccess(host.host)) {
          ns.exec('exec-hm.js', 'home', 1, host.host);
          hostsUnderManagement.push(host.host);
        }
      }
    }

    ns.print(hostsUnderManagement);

    await ns.sleep(5000);
  }
}
