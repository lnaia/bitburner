import type {NS} from './NetscriptDefinitions';
import {log} from './lib-log';
import {HACK_SCRIPT, isHackChanceTooHigh, execBatchHack} from './lib-hack';
import {stopConditionGrow, growToPercent, GROW_SCRIPT} from './lib-grow';
import {
  stopConditionWeaken,
  lowerToMinSecurity,
  WEAKEN_SCRIPT,
} from './lib-weaken';
import {cleanupExistingScripts} from './lib-script';

const LIMIT_MAX_MONEY_PERCENT = 0.95;

export const prepareHackBatch = async (
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

  while (isHackChanceTooHigh(ns, targetHost)) {
    log(ns, 'hack chance too high w/ min security - host is no-op');
    await ns.sleep(60_000); // sleep 1m
  }

  while (!stopConditionGrow(ns, targetHost, LIMIT_MAX_MONEY_PERCENT)) {
    log(ns, `${targetHost}@hackManager: not grown enough`);
    await growToPercent(ns, targetHost, LIMIT_MAX_MONEY_PERCENT, useHome);
    await ns.sleep(1000);
  }

  let tick = 0;
  while (tick < 3) {
    log(ns, `${targetHost}@tick-${tick}: batch hacking starting.`);
    await execBatchHack(ns, targetHost);

    tick += 1;
    await ns.sleep(1000);
  }
};

export async function main(ns: NS) {
  ns.clearLog();
  ns.tail();
  const host = ns.args[0].toString();

  await prepareHackBatch(ns, host, true);
}
