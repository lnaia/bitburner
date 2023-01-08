import type {NS} from './NetscriptDefinitions';
import type {AllocatedResources} from './typings';
import {log} from './lib-log';

import {ensureScriptIsPresent} from './lib-script';
import {discoverHosts} from './lib-discover-hosts';

const RESOURCES_LOCKED_FILE = 'resources-locked.txt';

const isLockActive = (ns: NS) => {
  return ns.fileExists(RESOURCES_LOCKED_FILE, 'home');
};

export const lockResources = (ns: NS) => {
  if (isLockActive(ns)) {
    return false;
  }

  ns.write(RESOURCES_LOCKED_FILE, '.', 'w');

  return true;
};

export const unlockResources = (ns: NS) => {
  ns.rm(RESOURCES_LOCKED_FILE, 'home');

  return !isLockActive(ns);
};

export const availableResources = (
  ns: NS,
  scriptRam: number,
  useHome?: boolean
) => {
  const resources: {[key: string]: number} = {};
  const rootedServers = discoverHosts(ns).filter(host =>
    ns.hasRootAccess(host)
  );
  const ownedServers = ns.getPurchasedServers();
  const hosts = [...rootedServers, ...ownedServers];

  if (useHome) {
    hosts.push('home');
  }

  for (const host of hosts) {
    const serverMaxRam = ns.getServerMaxRam(host);
    const serverRamInUse = ns.getServerUsedRam(host);
    const serverRamAvailable = serverMaxRam - serverRamInUse;
    const threads = Math.floor(serverRamAvailable / scriptRam);
    resources[host] = threads;
  }

  return resources;
};

// will allocate resources and secure them for up to 5 seconds
// after that time, those resources will be released
export const allocateResources = async (
  ns: NS,
  scriptRam: number,
  threadsNeeded: number,
  useHome?: boolean
): Promise<AllocatedResources> => {
  if (isLockActive(ns)) {
    log(ns, 'allocateResources: unable to allocate resources - lock is active');
    return [{}, 0];
  } else {
    if (!lockResources(ns)) {
      log(ns, 'allocateResources: unable to lock resources - why?', 'fatal');
      return ns.exit();
    }
  }

  const resources = availableResources(ns, scriptRam, useHome);
  let threadsRemaining = threadsNeeded;
  let totalThreadsAvailable = 0;
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
        totalThreadsAvailable += threadsReserved;
        threadsRemaining -= threadsReserved;
      }
    }
  }

  ns.exec('exec-unlock-resources', 'home');
  return [resourcesAllocated, totalThreadsAvailable];
};

export const dispatchScriptToResources = (
  ns: NS,
  resources: AllocatedResources[0],
  script: string,
  targetHost: string,
  isDryRun: boolean
) => {
  ns.disableLog('ALL');
  Object.entries(resources).forEach(([host, threads]) => {
    ensureScriptIsPresent(ns, host, script);
    const execArgs: [string, string, number, string, number] = [
      script,
      host,
      threads,
      // args:
      targetHost,
      threads,
    ];

    if (isDryRun) {
      log(ns, `dispatchScriptToResources@dryRun: ${JSON.stringify(execArgs)}`);
    } else {
      // log(ns, `dispatchScriptToResources: ${JSON.stringify(execArgs)}`);
      ns.exec(...execArgs);
    }
  });
};
