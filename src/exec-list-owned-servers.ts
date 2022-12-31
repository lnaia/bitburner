import type {NS} from './NetscriptDefinitions';

export const main = (ns: NS) => {
  const servers = ns.getPurchasedServers();
  servers.forEach(host => {
    ns.tprint(host);
  });
};
