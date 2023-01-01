import {REMOTE_SERVER_PREFIX} from './constants';
import type {NS} from './NetscriptDefinitions';

const shouldExcludeHost = (host: string) => {
  const regex = new RegExp(`${REMOTE_SERVER_PREFIX}|home|darkweb`);
  return !regex.test(host);
};

export const discoverHosts = (ns: NS, onlyHackable = true): string[] => {
  const playerHackingLevel = ns.getHackingLevel();
  const connectedHosts = (host: string) =>
    ns.scan(host).filter(shouldExcludeHost);
  const visitedHosts: string[] = [];
  const visitHost = (baseHost: string) => {
    if (visitedHosts.includes(baseHost)) {
      return;
    } else if (shouldExcludeHost(baseHost)) {
      visitedHosts.push(baseHost);
    }

    connectedHosts(baseHost).forEach(host => visitHost(host));
  };

  visitHost('home');

  if (!onlyHackable) {
    return visitedHosts;
  }
  // only return hosts that are hackable
  return visitedHosts.filter(host => {
    try {
      return playerHackingLevel >= ns.getServerRequiredHackingLevel(host);
    } catch (e) {
      ns.print('unable to get host req hacking level: ', e.message);
      return false;
    }
  });
};
