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
    return scriptRamThreads.map(() => [{}, 0]);
  } else {
    if (!lockResources(ns)) {
      log(ns, 'allocateResources: unable to lock resources - why?', 'fatal');
      return ns.exit();
    }
  }

  const arraysEqual = (a1: number[], a2: number[]) => {
    let result = true;

    if (!Array.isArray(a1) || !Array.isArray(a2)) {
      return false;
    }

    for (let i = 0; i < a1.length; i += 1) {
      if (a1[i] !== a2[i]) {
        result = false;
        break;
      }
    }

    return result;
  };

  const resourcesAvailable = availableResources(ns, useHome);
  const threadsRemaining: number[] = scriptRamThreads.map(arr => arr[1]);
  const allocatedResourceList: AllocatedResources[] = scriptRamThreads.map(
    () => {
      return [{}, 0];
    }
  );

  // A full cycle is when we get at least 1 slot, for every script/thread pair.
  let lastCycleThreadRemaining: number[] | null = null;
  const equalThreadsRemaining = () => {
    return threadsRemaining.every(el => el > 0);
  };

  const MAX_LOOP_PREVENTION_COUNT = 1000;
  let cycleCounter = 0;
  let equalCounter = 0;

  // if threadsRemaining does not change in two sequential cycles, it's time to exit
  // as we cannot take it further, given the ratio is 1:1
  const calcEqualCounter = () => {
    if (arraysEqual(lastCycleThreadRemaining, threadsRemaining)) {
      equalCounter += 1;
    }
  };

  while (
    equalThreadsRemaining() &&
    cycleCounter < MAX_LOOP_PREVENTION_COUNT &&
    equalCounter <= 1
  ) {
    lastCycleThreadRemaining = JSON.parse(JSON.stringify(threadsRemaining));

    for (let i = 0; i < scriptRamThreads.length; i += 1) {
      const [scriptRam] = scriptRamThreads[i];
      for (const resourceAvailable of Object.entries(resourcesAvailable)) {
        const [host, hostRamAvailable] = resourceAvailable;
        const currentThreadsRemaining = threadsRemaining[i];

        if (currentThreadsRemaining <= 0) {
          continue;
        }

        if (hostRamAvailable < scriptRam) {
          continue;
        }

        // update remaining threads in place
        threadsRemaining.splice(i, 1, currentThreadsRemaining - 1);

        // update remaining ram for this host
        resourcesAvailable[host] = hostRamAvailable - scriptRam;

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

    calcEqualCounter();
    cycleCounter += 1;
  }

  if (cycleCounter >= MAX_LOOP_PREVENTION_COUNT) {
    log(
      ns,
      'allocateResources: MAX_LOOP_PREVENTION_COUNT enforcement - investigate'
    );
  }

  ns.exec('exec-unlock-resources.js', 'home');
  return allocatedResourceList;
};

export const dispatchScriptToResources = (
  ns: NS,
  resources: AllocatedResources[0],
  script: string,
  targetHost: string,
  isDryRun: boolean,
  waitTime?: number
) => {
  ns.disableLog('ALL');
  Object.entries(resources).forEach(([host, threads]) => {
    ensureScriptIsPresent(ns, host, script);
    const execArgs: [string, string, number, string, number, number, number?] =
      [
        script,
        host,
        threads,
        // args:
        targetHost,
        threads,
        0, // affect stock
      ];

    if (waitTime > 0) {
      execArgs.push(waitTime);
    }

    if (isDryRun) {
      log(ns, `dispatchScriptToResources@dryRun: ${JSON.stringify(execArgs)}`);
    } else {
      // log(ns, `dispatchScriptToResources: ${JSON.stringify(execArgs)}`);
      ns.exec(...execArgs);
    }
  });
};
