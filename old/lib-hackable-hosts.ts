import type {NS} from './NetscriptDefinitions';
import {discoverHosts} from './lib-discover-hosts';
import {hostInfo} from './lib-host-info';
import type {HostDetails} from './typings';

export const listHackableHosts = (ns: NS): HostDetails[] => {
  return discoverHosts(ns)
    .filter(host => ns.hasRootAccess(host) && ns.getServerMaxMoney(host) > 1)
    .map(host => hostInfo(ns, host))
    .sort((a, b) => b.mm - a.mm);
};
