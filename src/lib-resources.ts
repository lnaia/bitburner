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

export const availableResources = (ns: NS, useHome?: boolean) => {
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
    resources[host] = serverRamAvailable;
    console.log('map: ', {host, result: serverMaxRam - serverRamInUse});
  }

  return resources;
};

/**
 * Allocates resources and secure them for up to 5 seconds.
 * After that time, those resources will be released.
 * When receiving multiple pairs, ratio will always be 1:1
 *
 * Example:
 *
 * [[4 ram, 10 threads], [1 ram, 1000 threads]]
 *
 * const sample = [
 *   [4, 10],
 *   [1, 1000],
 * ];
 *
 * With only 5 ram free, in 2 hosts:
 *
 * const sampleResult = [
 *   [{a: 1}, 1],
 *   [{b: 1}, 1],
 * ];
 */
export const allocateResources = async (
  ns: NS,
  scriptRamThreads: [number, number][],
  useHome?: boolean
): Promise<AllocatedResources[]> => {
  if (isLockActive(ns)) {
    log(ns, 'allocateResources: unable to allocate resources - lock is active');
    return [[{}, 0]];
  } else {
    if (!lockResources(ns)) {
      log(ns, 'allocateResources: unable to lock resources - why?', 'fatal');
      return ns.exit();
    }
  }

  const resourcesAvailable = availableResources(ns, useHome);
  console.log('resourcesAvailable: ', resourcesAvailable);
  const threadsRemaining: number[] = scriptRamThreads.map(arr => arr[1]);
  const allocatedResourceList: AllocatedResources[] = scriptRamThreads.map(
    () => {
      return [{}, 0];
    }
  );

  // A full cycle is when we get at least 1 slot, for every script/thread pair.

  for (let i = 0; i < scriptRamThreads.length; i += 1) {
    const [scriptRam] = scriptRamThreads[i];
    for (const resourceAvailable of Object.entries(resourcesAvailable)) {
      const [host, serverRamAvailable] = resourceAvailable;
      const currentThreadsRemaining = threadsRemaining[i];

      if (currentThreadsRemaining <= 0) {
        continue;
      }

      if (serverRamAvailable < scriptRam) {
        continue;
      }

      // update remaining threads in place
      threadsRemaining.splice(i, 1, currentThreadsRemaining - 1);

      // update remaining ram for this host
      resourcesAvailable[host] = serverRamAvailable - scriptRam;

      // updates host map for this scriptRamThread
      const hostThreadMap = allocatedResourceList[i][0];
      if (!(host in hostThreadMap)) {
        hostThreadMap[host] = 1;
      } else {
        hostThreadMap[host] += 1;
      }

      // updates totalThread count for this scriptRamThread
      const currentTotalThreadCount = allocatedResourceList[i][1];
      allocatedResourceList[i].splice(1, 1, currentTotalThreadCount + 1);
    }
  }

  ns.exec('exec-unlock-resources', 'home');
  return allocatedResourceList;
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
