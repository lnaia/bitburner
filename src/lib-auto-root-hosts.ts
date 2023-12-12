import type {NS} from './NetscriptDefinitions';
import type {StatusReport} from './typings';
import {discoverHosts} from './lib-discover-hosts';

const openPorts = (ns: NS, host: string): StatusReport => {
  const portEnforcers = {
    'BruteSSH.exe': (h: string) => ns.brutessh(h),
    'FTPCrack.exe': (h: string) => ns.ftpcrack(h),
    'relaySMTP.exe': (h: string) => ns.relaysmtp(h),
    'HTTPWorm.exe': (h: string) => ns.httpworm(h),
    'SQLInject.exe': (h: string) => ns.sqlinject(h),
  };

  const countPortEnforcers = () => {
    return Object.keys(portEnforcers).reduce((total, portEnforcer) => {
      if ((ns.fileExists(portEnforcer), 'home')) {
        return total + 1;
      }
      return total;
    }, 0);
  };

  const existingPortEnforcers = countPortEnforcers();
  const portsRequired = ns.getServerNumPortsRequired(host);
  if (portsRequired > existingPortEnforcers) {
    return [
      false,
      `openPorts: failed, ports required ${portsRequired} > ${existingPortEnforcers}`,
    ];
  }

  let portsOpen = 0;
  if (portsOpen === portsRequired) {
    return [true];
  }

  for (const [app, cmd] of Object.entries(portEnforcers)) {
    if (ns.fileExists(app, 'home')) {
      cmd(host);
      portsOpen += 1;
    }

    // open only what you need - no more
    if (portsOpen === portsRequired) {
      break;
    }
  }

  return [true];
};

export const getRoot = (ns: NS, host: string): StatusReport => {
  if (!openPorts(ns, host)) {
    return [false, `getRootAccess@${host}: unable to open ports`];
  }

  const isHackable =
    ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(host);

  if (!ns.hasRootAccess(host) && isHackable) {
    try {
      ns.nuke(host);
    } catch (e) {
      return [false, `getRootAccess@${host}: unable to nuke ${e.message}`];
    }
  }

  return [ns.hasRootAccess(host), `getRootAccess@${host} success`];
};
export const autoRootHosts = (ns: NS): StatusReport[] => {
  return discoverHosts(ns).map(host => getRoot(ns, host));
};
