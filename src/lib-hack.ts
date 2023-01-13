import type {NS} from './NetscriptDefinitions';
import {log} from './lib-log';
import {getActionTimeDuration} from './lib-time';
import {
  calculateThreadsWeaken,
  WEAKEN_SCRIPT,
  stopConditionWeaken,
} from './lib-weaken';
import {calculateThreadsGrowRelativeToValue} from './lib-grow';
import {allocateResources, dispatchScriptToResources} from './lib-resources';
import type {HackJob} from './typings';

// decimal form, 0.1 === 10%
// represents the percentage of money to hack from current money
export const MAX_HACK_PERCENT = 0.1;
export const HACK_SCRIPT = 'hack-hack.js';
export const HACK_CHANCE_THRESHOLD = 95;

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
): [number, number] => {
  ns.disableLog('ALL');
  const currMoney = ns.getServerMoneyAvailable(host) * maxMoneyPercent;
  const requiredThreads = Math.ceil(ns.hackAnalyzeThreads(host, currMoney));

  if (requiredThreads === -1) {
    return [0, 0];
  }

  // ns.print(`${host}@calculateThreadsHack: requiredThreads=${requiredThreads}`);
  return [requiredThreads, currMoney];
};

//. launch one hack. that's it. no more.
export const hackPercent = async (
  ns: NS,
  host: string,
  percent = MAX_HACK_PERCENT,
  useHome: boolean
) => {
  const chance = ns.hackAnalyzeChance(host) * 100;
  if (chance <= HACK_CHANCE_THRESHOLD) {
    log(ns, `hackPercent: chance too low, chance=${chance}`);
    return false;
  }

  const [hackThreads, moneyToHack] = calculateThreadsHack(ns, host, percent);

  // hack and weaken
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

// we'll never hack a server that has security at a minimum
// and hack chance is below the threshold
// might as well log and exit.
export const isHackChanceTooHigh = (ns: NS, host: string) => {
  if (stopConditionWeaken(ns, host)) {
    return false;
  }

  const chance = ns.hackAnalyzeChance(host) * 100;
  return chance < HACK_CHANCE_THRESHOLD;
};

export const batchHack = (ns: NS, host: string) => {
  const [hackThreads, hackMoney] = calculateThreadsHack(ns, host);
  const hackSecurityIncrease = ns.hackAnalyzeSecurity(hackThreads, host);
  const hackWeakenThreads = calculateThreadsWeaken(
    ns,
    host,
    hackSecurityIncrease
  );

  const growThreads = calculateThreadsGrowRelativeToValue(ns, host, hackMoney);
  const growSecurityIncrease = ns.growthAnalyzeSecurity(growThreads, host);
  const growWeakenThreads = calculateThreadsWeaken(
    ns,
    host,
    growSecurityIncrease
  );

  const hackTime = ns.getWeakenTime(host);
  const weakenTime = ns.getWeakenTime(host);
  const growTime = ns.getGrowTime(host);

  // finish order:
  // hack, hackWeaken, grow, growWeaken
  // what's the starting time and order?
  //

  const jobs: HackJob[] = [
    {waitTime: 0, runTime: hackTime, threads: hackThreads, type: 'hack'},
    {
      waitTime: 0,
      runTime: weakenTime,
      threads: hackWeakenThreads,
      type: 'hack-weaken',
    },
    {waitTime: 0, runTime: growTime, threads: growThreads, type: 'grow'},
    {
      waitTime: 0,
      runTime: weakenTime,
      threads: growWeakenThreads,
      type: 'grow-weaken',
    },
  ].sort((a, b) => {
    return a.runTime - b.runTime;
  });

  /**
   * [
   *    {waitTime: 0, runTime: 4, threads: 1, type: 'grow-weaken'},
   *    {waitTime: 0, runTime: 3, threads: 1, type: 'hack-weaken'},
   *    {waitTime: 0, runTime: 2, threads: 1, type: 'grow'},
   *    {waitTime: 0, runTime: 1, threads: 1, type: 'hack'},
   * ]
   */
  return jobs.reduce((acc: [], job, currentIndex) => {
    if (acc.length === 0) {
      return [
        {
          ...job,
          waitTime: 0,
        },
      ];
    }

    return [
      ...acc,
      {
        ...job,
        waitTime: jobs[currentIndex - 1].runTime,
      },
    ];
  }, []);

  /**
   * [
   *    {waitTime: 0, runTime: 4, threads: 1, type: 'grow-weaken'},
   *    {waitTime: 1, runTime: 3, threads: 1, type: 'hack-weaken'},
   *    {waitTime: 2, runTime: 2, threads: 1, type: 'grow'},
   *    {waitTime: 3, runTime: 1, threads: 1, type: 'hack'},
   * ]
   */
};
