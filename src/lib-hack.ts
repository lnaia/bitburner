import type {NS} from './NetscriptDefinitions';
import {log} from './lib-log';
import {getActionTimeDuration} from './lib-time';
import {calculateThreadsWeaken, WEAKEN_SCRIPT} from './lib-weaken';
import {allocateResources, dispatchScriptToResources} from './lib-resources';

export const HACK_SCRIPT = 'hack-weaken.js';

// decimal form, 0.1 === 10%
// represents the percentage of money to hack from current money
const MAX_HACK_PERCENT = 0.1;

export const stopConditionHack = (ns: NS, targetHost: string) => {
  ns.disableLog('ALL');
  const safetyMargin = 1000;
  const moneyAvailable = ns.getServerMoneyAvailable(targetHost);
  const isTargetRich = moneyAvailable <= safetyMargin;

  // ns.print(`${targetHost}@stopConditionHack: ${isTargetRich}`);
  return isTargetRich;
};

export const calculateThreadsHack = (
  ns: NS,
  host: string,
  maxMoneyPercent = MAX_HACK_PERCENT
) => {
  ns.disableLog('ALL');
  const currMoney = ns.getServerMoneyAvailable(host) * maxMoneyPercent;
  const requiredThreads = Math.ceil(ns.hackAnalyzeThreads(host, currMoney));

  if (requiredThreads === -1) {
    return 0;
  }

  // ns.print(`${host}@calculateThreadsHack: requiredThreads=${requiredThreads}`);
  return requiredThreads;
};

//. launch one hack. that's it. no more.
export const hackPercent = async (
  ns: NS,
  host: string,
  percent = MAX_HACK_PERCENT,
  useHome: boolean
) => {
  const chance = ns.hackAnalyzeChance(host) * 100;
  if (chance <= 95) {
    log(ns, `hackPercent: chance too low, chance=${chance}`);
    return false;
  }

  const hackThreads = calculateThreadsHack(ns, host, percent);
  const securityIncrease = ns.hackAnalyzeSecurity(hackThreads, host);
  const weakenThreads = calculateThreadsWeaken(ns, host, securityIncrease);
  const weakenScriptRam = ns.getScriptRam(WEAKEN_SCRIPT);
  const hackScriptRam = ns.getScriptRam(HACK_SCRIPT);

  const scriptRam = hackScriptRam + weakenScriptRam;
  const threads = hackThreads + weakenThreads;

  let [resources, totalThreadsAvailable] = await allocateResources(
    ns,
    scriptRam,
    threads,
    useHome
  );

  // wait for at least two threads: one for each script
  while (totalThreadsAvailable < 2) {
    [resources, totalThreadsAvailable] = await allocateResources(
      ns,
      scriptRam,
      threads,
      useHome
    );
    await ns.sleep(1000);
  }

  if (totalThreadsAvailable === threads) {
    // \o/ peak performance!
    dispatchScriptToResources(ns, resources, HACK_SCRIPT, host, false);
    dispatchScriptToResources(ns, resources, WEAKEN_SCRIPT, host, false);
    log(
      ns,
      `${host}@hackPercent: all thread requirements fulfilled - optimal performance`
    );
  } else {
    // at least two threads are available, and we want a 1:1 ratio
  }

  const weakenTime = ns.getWeakenTime(host);
  const hackTime = ns.getHackTime(host);
  // wait for the longest, they are executed concurrently.
  const singleThreadActionTime = weakenTime > hackTime ? weakenTime : hackTime;

  const {s, m, h} = getActionTimeDuration(singleThreadActionTime);
  log(ns, `${host}@hackPercent: waking up in ${s}(s) or ${m}(m) or ${h}(h)`);

  const safetyMargin = 2000;
  await ns.sleep(singleThreadActionTime + safetyMargin);

  return true;
};
