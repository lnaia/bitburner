import type {NS} from './NetscriptDefinitions';
import {log} from '../lib-log';
import {
  HACK_SCRIPT,
  stopConditionHack,
  hackPercent,
  isHackChanceTooHigh,
} from './lib-hack';
import {stopConditionGrow, growToPercent, GROW_SCRIPT} from './lib-grow';
import {
  stopConditionWeaken,
  lowerToMinSecurity,
  WEAKEN_SCRIPT,
} from './lib-weaken';
import {cleanupExistingScripts} from './lib-script';

const LIMIT_MAX_MONEY_PERCENT = 0.75;
const MAX_HACK_PERCENT = 0.1;

export const hackManager = async (
  ns: NS,
  targetHost: string,
  useHome: boolean
) => {
  ns.disableLog('ALL');

  await cleanupExistingScripts(ns, targetHost, [
    GROW_SCRIPT,
    WEAKEN_SCRIPT,
    HACK_SCRIPT,
  ]);

  log(ns, `${targetHost}@hackManager: loop-start`);

  while (!stopConditionWeaken(ns, targetHost)) {
    log(ns, `${targetHost}@hackManager: not weak enough`);
    await lowerToMinSecurity(ns, targetHost, useHome);
    await ns.sleep(1000);
  }

  if (isHackChanceTooHigh(ns, targetHost)) {
    log(ns, 'hack chance too high w/ min security - host is no-op');
    ns.exit();
  }

  while (!stopConditionGrow(ns, targetHost, LIMIT_MAX_MONEY_PERCENT)) {
    log(ns, `${targetHost}@hackManager: not grown enough`);
    await growToPercent(ns, targetHost, LIMIT_MAX_MONEY_PERCENT, useHome);
    await ns.sleep(1000);
  }

  // while (!stopConditionHack(ns, targetHost)) {
  log(ns, `${targetHost}@hackManager: not hacked enough`);
  await hackPercent(ns, targetHost, MAX_HACK_PERCENT, useHome);
  await ns.sleep(1000);
  // }
};
