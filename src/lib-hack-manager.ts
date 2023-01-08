import type {NS} from './NetscriptDefinitions';
import {log} from './lib-log';
import {HACK_SCRIPT} from './lib-hackts';
import {stopConditionGrow, growToPercent, GROW_SCRIPT} from './lib-grow';
import {
  stopConditionWeaken,
  lowerToMinSecurity,
  WEAKEN_SCRIPT,
} from './lib-weaken';
import {cleanupExistingScripts} from './lib-script';

const LIMIT_MAX_MONEY_PERCENT = 0.75;

export const hackCoordinator = async (
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

  log(ns, `${targetHost}@hackCoordinator: loop-start`);

  while (!stopConditionWeaken(ns, targetHost)) {
    log(ns, `${targetHost}@hackCoordinator: not weak enough`);
    await lowerToMinSecurity(ns, targetHost, useHome);
    await ns.sleep(1000);
  }

  while (!stopConditionGrow(ns, targetHost, LIMIT_MAX_MONEY_PERCENT)) {
    log(ns, `${targetHost}@hackCoordinator: not grown enough`);
    await growToPercent(ns, targetHost, LIMIT_MAX_MONEY_PERCENT, useHome);
    await ns.sleep(1000);
  }

  /**
   * grow money and diminuish security in percent batches until threads are aligned with exisitng resources
   * can I reserve total threads in one go? if so do it
   * if not, can I do it with less 10%? loop until you find sweet spot
   */

  // Returns the part of the specified server’s money you will steal with a single thread hack.
  // ns.hackAnalyze;

  // Returns the security increase that would occur if a hack with this many threads happened.
  // ns.hackAnalyzeSecurity

  // Get the chance of successfully hacking a server.
  // ns.hackAnalyzeChance()

  // This function returns the number of script threads you need when running the hack command
  // to steal the specified amount of money from the target server. If hackAmount is less than
  // zero or greater than the amount of money available on the server, then this function returns -1.
  // ns.hackAnalyzeThreads
};
