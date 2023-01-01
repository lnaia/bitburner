import type {NS} from './NetscriptDefinitions';
import type {StatusReport} from './typings';
import {HACK_SCRIPT} from './constants';
import {discoverHosts} from './lib-discover-hosts';
import {listHackableHosts} from './lib-hackable-hosts';
import {provision} from './lib-provision';

export const autoProvisionHosts = (ns: NS) => {
  const ownedServers = ns.getPurchasedServers();
  const hackedServers = discoverHosts(ns).filter(
    host => ns.hasRootAccess(host) && ns.getServerMaxRam(host) > 0
  );

  // hosts sorted by ram desc
  const hosts = ['home', ...ownedServers, ...hackedServers]
    .map(host => ({
      host,
      ram: ns.getServerMaxRam(host),
    }))
    .sort((a, b) => b.ram - a.ram)
    .map(item => item.host);

  const statusReports: StatusReport[] = [];
  const hackableHosts = listHackableHosts(ns);

  for (let i = 0, targetIndex = 0; i < hosts.length - 1; i += 1) {
    const host = hosts[i];

    // evolution of this would be to spread among available threads...
    // 1 server for each host, with exceptions:
    // fallbacks is the most profitable host first
    const profitableHost = (() => {
      if (/remote-server|home/.test(host)) {
        if (i < hackableHosts.length) {
          targetIndex = i;
        } else {
          targetIndex = 0;
        }

        return hackableHosts[targetIndex].host;
      }

      return hackableHosts[0].host;
    })();

    const status = provision(ns, host, HACK_SCRIPT, [profitableHost]);
    statusReports.push(status);
  }

  return statusReports;
};
