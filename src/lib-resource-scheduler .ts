import type {NS} from './NetscriptDefinitions';
import {availableResources} from './lib-resources';
import type {Job} from './typings';

export const isCapacityEnough = (ns: NS, jobs: Job[], useHome?: boolean) => {
  let enoughResourceCapacity = true;

  const allocatedResourceList: {[key: string]: number}[] = jobs.map(() => ({}));
  const resourcesAvailable = availableResources(ns, useHome);
  const threadsRemaining: number[] = jobs.map(job => job.threads);

  for (let i = 0; i < jobs.length; i += 1) {
    const {script} = jobs[i];
    const scriptRam = ns.getScriptRam(script);

    for (const resourceAvailable of Object.entries(resourcesAvailable)) {
      const [host, hostRamAvailable] = resourceAvailable;
      const currentThreadsRemaining = threadsRemaining[i];

      // this job has had all threads allocated
      if (currentThreadsRemaining <= 0) {
        continue;
      }

      // not enough ram left, next host
      if (hostRamAvailable < scriptRam) {
        continue;
      }

      // maxThreads I can run on this host
      const maxThreads = Math.floor(hostRamAvailable / scriptRam);
      const threadsPossible =
        maxThreads > currentThreadsRemaining
          ? currentThreadsRemaining
          : maxThreads;

      // update remaining threads in place
      threadsRemaining.splice(i, 1, currentThreadsRemaining - threadsPossible);

      // update remaining ram for this host
      resourcesAvailable[host] = hostRamAvailable - scriptRam * threadsPossible;

      // updates allocatedResourceList for this job
      const hostThreadMap = allocatedResourceList[i];
      if (!(host in hostThreadMap)) {
        hostThreadMap[host] = threadsPossible;
      } else {
        hostThreadMap[host] += threadsPossible;
      }
    }

    if (threadsRemaining[i] !== 0) {
      enoughResourceCapacity = false;
      break;
    }
  }

  return [
    enoughResourceCapacity,
    enoughResourceCapacity ? allocatedResourceList : null,
  ];
};

export const queueJob = (ns: NS) => {
  // job comes from queue, not args
  //   ns.readPort(1) READ from here, write job to port 2 if ok
  // port 2 runs on the exec that has the queue list itself (source of truth)
};

export const consumeJobFromQueue = () => {};
