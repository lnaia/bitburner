import type {NS} from './NetscriptDefinitions';
import {log} from './lib-log';
import {getActionTimeDuration} from './lib-time';
import {
  calculateThreadsWeaken,
  WEAKEN_SCRIPT,
  stopConditionWeaken,
} from './lib-weaken';
import {calculateThreadsGrowRelativeToValue, GROW_SCRIPT} from './lib-grow';
import {allocateResources, dispatchScriptToResources} from './lib-resources';
import type {AllocatedResources, HackJob} from './typings';

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

export const sortAndWaitJobs = (jobList: HackJob[]) => {
  const jobs = jobList.sort((a, b) => {
    return b.runTime - a.runTime;
  });

  return jobs.reduce((acc: [], job, currentIndex) => {
    if (acc.length === 0) {
      return [
        {
          ...job,
          waitTime: 0,
        },
      ];
    }

    const diff = jobs[currentIndex - 1].runTime - job.runTime;

    return [
      ...acc,
      {
        ...job,
        waitTime: diff,
      },
    ];
  }, []);
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

  const hackWeakenPair = sortAndWaitJobs([
    {waitTime: 0, runTime: hackTime, threads: hackThreads, type: 'h'},
    {waitTime: 0, runTime: weakenTime, threads: hackWeakenThreads, type: 'hw'},
  ]);

  const growWeakenPair = sortAndWaitJobs([
    {waitTime: 0, runTime: growTime, threads: growThreads, type: 'g'},
    {waitTime: 0, runTime: weakenTime, threads: growWeakenThreads, type: 'gw'},
  ]);

  const inBetweenJobs = sortAndWaitJobs([hackWeakenPair[1], growWeakenPair[1]]);

  return [hackWeakenPair[0], ...inBetweenJobs, growWeakenPair[0]].map(
    (item, index) => {
      return {
        ...item,
        waitTime: item.waitTime + 1_000 * index,
      };
    }
  );
};

export const execBatchHack = async (ns: NS, host: string) => {
  const growScriptRam = ns.getScriptRam(GROW_SCRIPT);
  const weakenScriptRam = ns.getScriptRam(WEAKEN_SCRIPT);
  const hackScriptRam = ns.getScriptRam(HACK_SCRIPT);

  const calculatedResources = batchHack(ns, host);
  /**
   {
    "waitTime": 8438.496923447306,
    "runTime": 25753.987693789237,
    "threads": 87,
    "type": "g"
  },
   */

  const resourcesRequest: [number, number][] = calculatedResources.map(item => {
    let scriptRam = null;

    if (item.type === 'h') {
      scriptRam = hackScriptRam;
    } else if (item.type === 'hw') {
      scriptRam = weakenScriptRam;
    } else if (item.type === 'g') {
      scriptRam = growScriptRam;
    } else if (item.type === 'gw') {
      scriptRam = weakenScriptRam;
    } else {
      log(ns, `unknown type received: ${item.type}`);
      ns.exit();
    }

    return [scriptRam, item.threads];
  });

  let [hr, hwr, g, gwr] = await allocateResources(
    ns,
    resourcesRequest,
    true // use home in the calculations
  );

  // wait for at least two threads: one for each script
  const haveRequiredThreads = (existing: AllocatedResources[]) => {
    return existing.every((item, index) => {
      return resourcesRequest[index][1] === item[1];
    });
  };

  while (haveRequiredThreads([hr, hwr, g, gwr])) {
    await ns.sleep(1000);
    [hr, hwr, g, gwr] = await allocateResources(
      ns,
      resourcesRequest,
      true // use home in the calculations
    );
  }

  // all threads available!
  dispatchScriptToResources(
    ns,
    hr[0],
    HACK_SCRIPT,
    host,
    false,
    calculatedResources[0].waitTime
  );
  dispatchScriptToResources(
    ns,
    hwr[0],
    WEAKEN_SCRIPT,
    host,
    false,
    calculatedResources[1].waitTime
  );
  dispatchScriptToResources(
    ns,
    g[0],
    GROW_SCRIPT,
    host,
    false,
    calculatedResources[2].waitTime
  );
  dispatchScriptToResources(
    ns,
    gwr[0],
    WEAKEN_SCRIPT,
    host,
    false,
    calculatedResources[3].waitTime
  );
};
