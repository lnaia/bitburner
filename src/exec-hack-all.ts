import {discoverHosts} from './lib-discover-hosts';
import {hostInfo} from './lib-host-info';
import type {NS} from './NetscriptDefinitions';

const HACK_MANAGER_SCRIPT = 'exec-hm.js';
const HACK_MANAGER_HOST = 'home';

export async function main(ns: NS) {
  ns.disableLog('ALL');

  const scriptRamCost = ns.getScriptRam(HACK_MANAGER_SCRIPT);

  while (true) {
    const hosts = discoverHosts(ns)
      .map(host => hostInfo(ns, host))
      .filter(host => host.mm > 0)
      .sort((a, b) => a.mm - b.mm); // less max money first, easier to snowball

    const hostsUnderManagement: string[] = [];

    for (const host of hosts) {
      if (!hostsUnderManagement.includes(host.host)) {
        const serverMaxRam = ns.getServerMaxRam(HACK_MANAGER_HOST);
        const serverUsedRam = ns.getServerUsedRam(HACK_MANAGER_HOST);
        const serverFreeRam = serverMaxRam - serverUsedRam;
        const canRunScript = serverFreeRam >= scriptRamCost; // assumed is, that we run it on a SINGLE thread.

        if (ns.hasRootAccess(host.host) && canRunScript) {
          ns.exec(HACK_MANAGER_SCRIPT, HACK_MANAGER_HOST, 1, host.host); // home is our controller HQ! because otherwise CBA to code dynamic HQ
          hostsUnderManagement.push(host.host);
        }
      }
    }

    ns.clearLog();
    ns.print(new Date());
    hostsUnderManagement.forEach((host, index) => {
      ns.print(`${index}: ${host}`);
    });

    await ns.sleep(5000);
  }
}
