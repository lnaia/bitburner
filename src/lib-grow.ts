import type {NS} from './NetscriptDefinitions';

import {log} from './lib-log';
import {getActionTimeDuration} from './lib-time';
import {allocateResources, dispatchScriptToResources} from './lib-resources';
import {calculateThreadsWeaken, stopConditionWeaken} from './lib-weaken';

const LIMIT_MAX_MONEY_PERCENT = 0.75;
export const GROW_SCRIPT = 'hack-grow.js';

export const stopConditionGrow = (
  ns: NS,
  host: string,
  maxPercent = LIMIT_MAX_MONEY_PERCENT
) => {
  ns.disableLog('ALL');
  const moneyAvailable = ns.getServerMoneyAvailable(host);
  const maxMoney = ns.getServerMaxMoney(host) * maxPercent;
  const isMoneyMaxed = moneyAvailable >= maxMoney;

  return isMoneyMaxed;
};

export const calculateThreadsGrow = (
  ns: NS,
  host: string,
  maxPercent = LIMIT_MAX_MONEY_PERCENT
) => {
  ns.disableLog('ALL');
  const maxMoney = ns.getServerMaxMoney(host) * maxPercent;
  let currMoney = ns.getServerMoneyAvailable(host);
  if (currMoney <= 0) {
    currMoney = 1;
  }

  let factor = 1;
  try {
    factor = Math.ceil(maxMoney / currMoney);
  } catch (e) {
    // ignore
    factor = 1;
  }

  return Math.ceil(ns.growthAnalyze(host, factor));
};

export const growToPercent = async (
  ns: NS,
  targetHost: string,
  percentLimit: number,
  useHome: boolean,
  currentLoop = 0
): Promise<boolean> => {
  ns.disableLog('ALL');
  const maxLoops = 100;

  if (stopConditionGrow(ns, targetHost, percentLimit)) {
    return true;
  } else if (currentLoop >= maxLoops) {
    // release execution control back to main orchestrator
    return false;
  }

  const growThreads = calculateThreadsGrow(ns, targetHost, percentLimit);
  const securityIncrease = ns.growthAnalyzeSecurity(growThreads, targetHost);
  const weakenThreads = calculateThreadsWeaken(
    ns,
    targetHost,
    securityIncrease
  );
  const weakenScriptRam = ns.getScriptRam(WEAKEN_SCRIPT);
  const growSriptRam = ns.getScriptRam(GROW_SCRIPT);

  if (weakenScriptRam !== growSriptRam) {
    log(
      ns,
      `growToPercent: ram missmatch unable to allocate resources with current logic weakenScriptRam=${weakenScriptRam} vs growSriptRam=${growSriptRam}`,
      'fatal'
    );
    ns.exit();
  }

  const scriptRam = growSriptRam + weakenScriptRam;
  const threads = growThreads + weakenThreads;
  let [resources, totalThreadsAvailable] = await allocateResources(
    ns,
    scriptRam,
    threads,
    useHome
  );
  // wait for at leat two threads: one for each script
  // resources might be locked for another concurrent execution
  // this is a compounded problem, because we are tring to do two operations in one go.
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
    dispatchScriptToResources(ns, resources, GROW_SCRIPT, targetHost, false);
    dispatchScriptToResources(ns, resources, WEAKEN_SCRIPT, targetHost, false);
    log(
      ns,
      `growToPercent@${targetHost}: all thread requirements fullfilled - optimal performance`
    );
  } else {
    // at least two threads are available, and we want a 1:1 ratio
  }

  const weakenTime = ns.getWeakenTime(targetHost);
  const growTime = ns.getGrowTime(targetHost);
  // wait for the longest, they are executed concurrently.
  const singleThreadActionTime = weakenTime > growTime ? weakenTime : growTime;

  const {s, m, h} = getActionTimeDuration(singleThreadActionTime);
  log(
    ns,
    `${targetHost}@lowerToMinSecurity: waking up in ${s}(s) or ${m}(m) or ${h}(h)`
  );

  const safetyMargin = 2000;
  await ns.sleep(singleThreadActionTime + safetyMargin);
  return growToPercent(ns, targetHost, percentLimit, useHome, currentLoop + 1);
};
