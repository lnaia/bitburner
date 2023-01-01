import type {NS} from './NetscriptDefinitions';
import {discoverHosts} from './lib-discover-hosts';

export const availableResources = (ns: NS, script: string) => {
  if (!ns.fileExists) {
    ns.print(`requested script does not exist - ${script}`);
    ns.exit();
  }

  const resources: {[key: string]: number} = {};
  const scriptRam = ns.getScriptRam(script);
  const hosts = discoverHosts(ns);

  for (const host of hosts) {
    const serverMaxRam = ns.getServerMaxRam(host);
    const serverRamInUse = ns.getServerUsedRam(host);
    const serverRamAvailable = serverMaxRam - serverRamInUse;
    const threads = Math.ceil(serverRamAvailable / scriptRam);
    resources[host] = threads;
  }

  return resources;
};

export const allocateResources = (
  ns: NS,
  script: string,
  threadsNeeded: number
) => {
  const resources = availableResources(ns, script);
  let threadsRemaining = threadsNeeded;
  const resourcesAllocated: {[key: string]: number} = {};

  for (const resource of Object.entries(resources)) {
    const [host, threadsAvailable] = resource;

    if (threadsRemaining > 0) {
      if (threadsAvailable > 0) {
        const threadsReserved = (() => {
          const remainingThreads = threadsAvailable - threadsRemaining;
          if (remainingThreads > 0) {
            return threadsAvailable - remainingThreads;
          }

          return threadsRemaining - Math.abs(remainingThreads);
        })();

        resourcesAllocated[host] = threadsReserved;
        threadsRemaining -= threadsReserved;
      }
    }
  }

  return resourcesAllocated;
};
