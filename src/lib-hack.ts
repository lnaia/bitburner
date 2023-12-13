import type {NS} from './NetscriptDefinitions';
import {log} from './lib-log';
import {getActionTimeDuration} from './lib-time';

const HACK_CHANCE_THRESHOLD = 95;
const LIMIT_MAX_MONEY_PERCENT = 0.75;
const ONE_SECOND = 1000;

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

const calcWeakenThreads = (ns: NS, host: string) => {
  const minSecurity = ns.getServerMinSecurityLevel(host);
  const currSec = ns.getServerSecurityLevel(host);
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
  const requiredWeakenThreads = calcWeakenThreads(ns, host);
  const totalWeakenTime = ns.getWeakenTime(host) * requiredWeakenThreads;

  const chance = ns.hackAnalyzeChance(host) * 100;
  if (chance <= HACK_CHANCE_THRESHOLD) {
    log(ns, `hackPercent: chance too low, chance=${chance}`);
    return false;
  }

  const currMoney = ns.getServerMoneyAvailable(host) * maxMoneyPercent;
  const requiredHackThreads = Math.ceil(ns.hackAnalyzeThreads(host, currMoney));
  if (requiredHackThreads === -1) {
    log(ns, `requiredThreads: -1`);
    return false;
  }
  const totalHackTime = ns.getHackTime(host);

  const securityIncreaseAfterHack = ns.hackAnalyzeSecurity(
    requiredHackThreads,
    host
  );

  const requiredThreadsGrow = calculateThreadsGrow(ns, host);
  const securityIncreaseAfterGrow = ns.growthAnalyzeSecurity(
    requiredThreadsGrow,
    host
  );
  const totalGrowTime = ns.getGrowTime(host);

  return true;
};
