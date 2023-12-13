import type {NS} from './NetscriptDefinitions';
import {log} from './lib-log';
import {printObjList} from './lib-print-obj-list';

const LIMIT_MAX_MONEY_PERCENT = 0.75;

const toSeconds = (input: number): number => {
  return input / 1000;
};

const calculateThreadsGrow = (
  ns: NS,
  host: string,
  maxPercent = LIMIT_MAX_MONEY_PERCENT
) => {
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

/** Calculates threads required to weaken a host to the min security possible
 * @param securityIncrease - override current security, useful when trying to calculate future security levels
 * @returns number of threads
 * */
const calcWeakenThreads = (ns: NS, host: string, securityIncrease?: number) => {
  const minSecurity = ns.getServerMinSecurityLevel(host);
  const currSec = securityIncrease
    ? minSecurity + securityIncrease
    : ns.getServerSecurityLevel(host);
  const weakenAmountPerThread = ns.weakenAnalyze(1);
  const securityToBeReduced = currSec - minSecurity;

  let requiredWeakenThreads = 0;
  if (securityToBeReduced > 0) {
    requiredWeakenThreads = Math.ceil(
      securityToBeReduced / weakenAmountPerThread
    );
  }

  return requiredWeakenThreads;
};

export const coordinator = (
  ns: NS,
  host: string,
  maxMoneyPercent = 0.9
): boolean => {
  const jobPlan = [];

  (() => {
    const requiredWeakenThreads = calcWeakenThreads(ns, host);
    jobPlan.push({
      type: 'weaken',
      threads: requiredWeakenThreads,
      time: toSeconds(ns.getWeakenTime(host) * requiredWeakenThreads),
      description: 'initial',
    });
  })();

  const requiredThreadsGrow = calculateThreadsGrow(ns, host);
  jobPlan.push({
    type: 'grow',
    threads: requiredThreadsGrow,
    time: toSeconds(ns.getGrowTime(host)),
    description: 'grow currency',
  });

  (() => {
    const securityIncreaseAfterGrow = ns.growthAnalyzeSecurity(
      requiredThreadsGrow,
      host
    );
    const requiredWeakenThreads = calcWeakenThreads(
      ns,
      host,
      securityIncreaseAfterGrow
    );

    jobPlan.push({
      type: 'weaken',
      threads: requiredWeakenThreads,
      time: toSeconds(ns.getWeakenTime(host) * requiredWeakenThreads),
      description: 'after sec inc due to growth ',
    });
  })();

  const currMoney = ns.getServerMoneyAvailable(host) * maxMoneyPercent;
  const requiredHackThreads = Math.ceil(ns.hackAnalyzeThreads(host, currMoney));
  if (requiredHackThreads === -1) {
    log(ns, `requiredThreads: -1`);
    return false;
  }
  jobPlan.push({
    type: 'hack',
    threads: requiredHackThreads,
    time: toSeconds(ns.getHackTime(host) * requiredHackThreads),
    description: 'steal currency',
  });

  (() => {
    const securityIncreaseAfterHack = ns.hackAnalyzeSecurity(
      requiredHackThreads,
      host
    );
    const requiredWeakenThreads = calcWeakenThreads(
      ns,
      host,
      securityIncreaseAfterHack
    );

    jobPlan.push({
      type: 'weaken',
      threads: requiredWeakenThreads,
      time: toSeconds(ns.getWeakenTime(host) * requiredWeakenThreads),
      description: 'after security inc due to hack',
    });
  })();

  const tprint = ns.tprint.bind(ns);
  printObjList(jobPlan, tprint);
  return true;
};
