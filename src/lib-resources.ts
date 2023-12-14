import type {NS} from './NetscriptDefinitions';
import {SCRIPT_HACK, SCRIPT_GROW, SCRIPT_WEAKEN} from './constants';
import {calculateThreads} from './lib-calculate-threads';
import {discoverHosts} from './lib-discover-hosts';
import {log} from './lib-log';
import {getActionTimeDuration} from './lib-time';
import {generateJobPlan} from './lib-hack';

export const totalAvailableRam = (ns: NS, useHome?: boolean) => {
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

const getScriptToRun = (type: string) => {
  if (type === 'grow') {
    return SCRIPT_GROW;
  } else if (type === 'weaken') {
    return SCRIPT_WEAKEN;
  } else if (type === 'hack') {
    return SCRIPT_HACK;
  }

  return '';
};

const execJob = (
  ns: NS,
  execHost: string,
  targetHost: string,
  scriptName: string,
  threads: number
) => {
  const scriptMemory = ns.getScriptRam(scriptName, targetHost);
  const maxThreads = calculateThreads(ns, scriptMemory, targetHost);

  if (threads > maxThreads) {
    log(ns, 'exec failed - not enough threads');
  } else {
    const pid = 1;
    // const pid = ns.exec(scriptName, execHost, threads, targetHost);
    if (pid) {
      log(
        ns,
        `exec script:${scriptName} host:${targetHost} threads:${threads} from:${execHost}`
      );
    } else {
      log(ns, 'exec failed - pid is 0');
    }
  }
};

const waitTime = async (ns: NS, seconds: number) => {
  const ONE_SECOND = 1000;
  let tick = 0;

  if (seconds <= 0) {
    return;
  }

  const {s, m, h} = getActionTimeDuration(seconds * 1000);
  log(ns, `waking up in ${s}(s) or ${m}(m) or ${h}(h)`);

  while (tick < s) {
    tick += 1;
    log(ns, `${s - tick}`);
    await ns.sleep(ONE_SECOND);
  }
};

export const resourceManager = async (ns: NS) => {
  const targetHost = 'n00dles';
  const execHost = 'home';
  const jobPlan = generateJobPlan(ns, targetHost);

  const timeMargin = 5;
  const [initialWeaken, growCash, growWeaken] = jobPlan;

  execJob(
    ns,
    execHost,
    targetHost,
    getScriptToRun(initialWeaken.type),
    initialWeaken.threads
  );
  await waitTime(ns, initialWeaken.time);

  let firstJob = growCash;
  let secondJob = growWeaken;
  if (growCash.time < growWeaken.time) {
    firstJob = growWeaken;
    secondJob = growCash;
  }

  execJob(
    ns,
    execHost,
    targetHost,
    getScriptToRun(firstJob.type),
    firstJob.threads
  );
  const timeDiff = timeMargin + (firstJob.time - secondJob.time);

  await waitTime(ns, timeDiff);

  execJob(
    ns,
    execHost,
    targetHost,
    getScriptToRun(secondJob.type),
    secondJob.threads
  );
};
