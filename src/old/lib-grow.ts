import type {NS} from './NetscriptDefinitions';

import {log} from '../lib-log';
import {getActionTimeDuration} from './lib-time';
import {allocateResources, dispatchScriptToResources} from './lib-resources';
import {calculateThreadsWeaken, WEAKEN_SCRIPT} from './lib-weaken';

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

export const calculateThreadsGrowRelativeToValue = (
  ns: NS,
  host: string,
  valueToGrow: number
) => {
  let currMoney = ns.getServerMoneyAvailable(host);
  if (currMoney <= 0) {
    currMoney = 1;
  }

  const valueToGrowDecimalForm = valueToGrow / currMoney;

  let factor = 1;
  try {
    factor = currMoney + valueToGrowDecimalForm;
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
  const growScriptRam = ns.getScriptRam(GROW_SCRIPT);

  if (weakenScriptRam !== growScriptRam) {
    log(
      ns,
      `growToPercent: ram mismatch unable to allocate resources with current logic weakenScriptRam=${weakenScriptRam} vs growSriptRam=${growScriptRam}`,
      'fatal'
    );
    ns.exit();
  }

  let [growResources, weakenResources] = await allocateResources(
    ns,
    [
      [growScriptRam, growThreads],
      [weakenScriptRam, weakenThreads],
    ],
    useHome
  );
  // wait for at least two threads: one for each script
  // resources might be locked for another concurrent execution
  // this is a compounded problem, because we are trying to do two operations in one go.
  while (growResources[1] < 1 && weakenResources[1] < 1) {
    await ns.sleep(1000);
    [growResources, weakenResources] = await allocateResources(
      ns,
      [
        [growScriptRam, growThreads],
        [weakenScriptRam, weakenThreads],
      ],
      useHome
    );
  }

  dispatchScriptToResources(
    ns,
    growResources[0],
    GROW_SCRIPT,
    targetHost,
    false
  );

  dispatchScriptToResources(
    ns,
    weakenResources[0],
    WEAKEN_SCRIPT,
    targetHost,
    false
  );

  const weakenTime = ns.getWeakenTime(targetHost);
  const growTime = ns.getGrowTime(targetHost);
  // wait for the longest, they are executed concurrently.
  const singleThreadActionTime = weakenTime > growTime ? weakenTime : growTime;

  const {s, m, h} = getActionTimeDuration(singleThreadActionTime);
  log(
    ns,
    `${targetHost}@growToPercent: waking up in ${s}(s) or ${m}(m) or ${h}(h)`
  );

  const safetyMargin = 5000;
  await ns.sleep(singleThreadActionTime + safetyMargin);
  return growToPercent(ns, targetHost, percentLimit, useHome, currentLoop + 1);
};

export const growToValue = async (
  ns: NS,
  host: string,
  valueToGrow: number,
  useHome: boolean,
  currentLoop = 0
) => {
  ns.disableLog('ALL');

  const growThreads = calculateThreadsGrowRelativeToValue(
    ns,
    host,
    valueToGrow
  );
  const securityIncrease = ns.growthAnalyzeSecurity(growThreads, host);
  const weakenThreads = calculateThreadsWeaken(ns, host, securityIncrease);
  const weakenScriptRam = ns.getScriptRam(WEAKEN_SCRIPT);
  const growScriptRam = ns.getScriptRam(GROW_SCRIPT);

  let [growResources, weakenResources] = await allocateResources(
    ns,
    [
      [growScriptRam, growThreads],
      [weakenScriptRam, weakenThreads],
    ],
    useHome
  );
  // wait for at least two threads: one for each script
  // resources might be locked for another concurrent execution
  // this is a compounded problem, because we are trying to do two operations in one go.
  while (growResources[1] < 1 && weakenResources[1] < 1) {
    await ns.sleep(1000);
    [growResources, weakenResources] = await allocateResources(
      ns,
      [
        [growScriptRam, growThreads],
        [weakenScriptRam, weakenThreads],
      ],
      useHome
    );
  }

  dispatchScriptToResources(ns, growResources[0], GROW_SCRIPT, host, false);
  dispatchScriptToResources(ns, weakenResources[0], WEAKEN_SCRIPT, host, false);

  const weakenTime = ns.getWeakenTime(host);
  const growTime = ns.getGrowTime(host);
  // wait for the longest, they are executed concurrently.
  const singleThreadActionTime = weakenTime > growTime ? weakenTime : growTime;

  const {s, m, h} = getActionTimeDuration(singleThreadActionTime);
  log(ns, `${host}@growToPercent: waking up in ${s}(s) or ${m}(m) or ${h}(h)`);

  const safetyMargin = 5000;
  await ns.sleep(singleThreadActionTime + safetyMargin);
};
