import type {NS} from './NetscriptDefinitions';
import {allocateResources, dispatchScriptToResources} from './lib-resources';
import {log} from '../lib-log';
import {getActionTimeDuration} from '../src/lib-time';

export const WEAKEN_SCRIPT = 'hack-weaken.js';

export const stopConditionWeaken = (ns: NS, host: string) => {
  ns.disableLog('ALL');
  const minSecurity = ns.getServerMinSecurityLevel(host);
  const currSecurity = ns.getServerSecurityLevel(host);

  return currSecurity <= minSecurity;
};

export const calculateThreadsWeaken = (
  ns: NS,
  host: string,
  securityDecreaseAmount?: number
) => {
  ns.disableLog('ALL');
  const minSecurity = ns.getServerMinSecurityLevel(host);
  const currSec = ns.getServerSecurityLevel(host);
  const weakenAmountPerThread = ns.weakenAnalyze(1);
  const securityToBeReduced = securityDecreaseAmount
    ? securityDecreaseAmount
    : Math.ceil(currSec - minSecurity);

  let requiredThreads = 0;
  if (securityToBeReduced > 0) {
    requiredThreads = Math.ceil(securityToBeReduced / weakenAmountPerThread);
  }

  return requiredThreads;
};

export const lowerToMinSecurity = async (
  ns: NS,
  targetHost: string,
  useHome: boolean,
  currentLoop = 0
): Promise<boolean> => {
  ns.disableLog('ALL');
  const maxLoops = 100;

  if (stopConditionWeaken(ns, targetHost)) {
    return true;
  } else if (currentLoop >= maxLoops) {
    // release execution control back to main orchestrator
    return false;
  }

  const script = WEAKEN_SCRIPT;
  const scriptRam = ns.getScriptRam(script);
  const threads = calculateThreadsWeaken(ns, targetHost);

  let [[resources, totalThreadsAvailable]] = await allocateResources(
    ns,
    [[scriptRam, threads]],
    useHome
  );
  // wait for at least one thread available
  // resources might be locked for another concurrent execution
  while (totalThreadsAvailable === 0) {
    await ns.sleep(1000);
    [[resources, totalThreadsAvailable]] = await allocateResources(
      ns,
      [[scriptRam, threads]],
      useHome
    );
  }

  dispatchScriptToResources(ns, resources, script, targetHost, false);

  const singleThreadActionTime = ns.getWeakenTime(targetHost);
  const {s, m, h} = getActionTimeDuration(singleThreadActionTime);

  log(
    ns,
    `${targetHost}@lowerToMinSecurity: waking up in ${s}(s) or ${m}(m) or ${h}(h)`
  );

  const safetyMargin = 5000;
  await ns.sleep(singleThreadActionTime + safetyMargin);

  return lowerToMinSecurity(ns, targetHost, useHome, currentLoop + 1);
};
