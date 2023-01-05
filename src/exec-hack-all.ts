import {discoverHosts} from './lib-discover-hosts';
import {hostInfo} from './lib-host-info';
import type {NS} from './NetscriptDefinitions';

const HACK_MANAGER_SCRIPT = 'exec-hm.js';
const HACK_MANAGER_HOST = 'home';
const RESERVED_SCRIPTS_RAM = [
  'exec-coordinator.js',
  'exec-monitor-hosts.js',
  'exec-monitor-fleet.js',
];

const homeFreeRam = (ns: NS) => {
  const serverMaxRam = ns.getServerMaxRam(HACK_MANAGER_HOST);
  const serverUsedRam = ns.getServerUsedRam(HACK_MANAGER_HOST);
  const maxReservedScriptsRam = RESERVED_SCRIPTS_RAM.reduce((acc, script) => {
    return acc + ns.getScriptRam(script, 'home');
  }, 0);
  const processes = ns.ps('home');
  const reservedScriptsRamAlreadyInUsed = processes.reduce((acc, process) => {
    if (RESERVED_SCRIPTS_RAM.includes(process.filename)) {
      return acc + ns.getScriptRam(process.filename);
    }

    return acc;
  }, 0);

  let reservedScriptsRam = maxReservedScriptsRam;
  if (reservedScriptsRamAlreadyInUsed > 0) {
    reservedScriptsRam -= reservedScriptsRamAlreadyInUsed;
  }

  const usedRam = serverUsedRam - reservedScriptsRam;
  return serverMaxRam - (usedRam + reservedScriptsRam);
};
export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.tail();

  const scriptRamCost = ns.getScriptRam(HACK_MANAGER_SCRIPT);
  const hostsUnderManagement: string[] = [];

  while (true) {
    const hosts = discoverHosts(ns)
      .map(host => hostInfo(ns, host))
      .filter(host => host.mm > 0)
      .sort((a, b) => a.mm - b.mm); // less max money first, easier to snowball

    for (const host of hosts) {
      if (!hostsUnderManagement.includes(host.host)) {
        const serverFreeRam = homeFreeRam(ns);
        const canRunScript = serverFreeRam >= scriptRamCost; // assumed is, that we run it on a SINGLE thread.

        if (ns.hasRootAccess(host.host) && canRunScript) {
          ns.exec(HACK_MANAGER_SCRIPT, HACK_MANAGER_HOST, 1, host.host, false); // home is our controller HQ! because otherwise CBA to code dynamic HQ
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
