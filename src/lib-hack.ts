import type {NS} from './NetscriptDefinitions';
import {log} from './lib-log';
import {getActionTimeDuration} from './lib-time';
import {calculateThreadsWeaken, WEAKEN_SCRIPT} from './lib-weaken';
import {allocateResources, dispatchScriptToResources} from './lib-resources';

export const HACK_SCRIPT = 'hack-hack.js';

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

  let [hackResources, weakenResources] = await allocateResources(
    ns,
    [
      [hackScriptRam, hackThreads],
      [weakenScriptRam, weakenThreads],
    ],
    useHome
  );

  // wait for at least two threads: one for each script
  while (hackResources[1] < 1 && weakenResources[1] < 1) {
    await ns.sleep(1000);
    [hackResources, weakenResources] = await allocateResources(
      ns,
      [
        [hackScriptRam, hackThreads],
        [weakenScriptRam, weakenThreads],
      ],
      useHome
    );
  }

  dispatchScriptToResources(ns, hackResources[0], HACK_SCRIPT, host, false);
  dispatchScriptToResources(ns, weakenResources[0], WEAKEN_SCRIPT, host, false);

  const weakenTime = ns.getWeakenTime(host);
  const hackTime = ns.getHackTime(host);
  // wait for the longest, they are executed concurrently.
  const singleThreadActionTime = weakenTime > hackTime ? weakenTime : hackTime;

  const {s, m, h} = getActionTimeDuration(singleThreadActionTime);
  log(ns, `${host}@hackPercent: waking up in ${s}(s) or ${m}(m) or ${h}(h)`);

  const safetyMargin = 5000;
  await ns.sleep(singleThreadActionTime + safetyMargin);

  return true;
};
