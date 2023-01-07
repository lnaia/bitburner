import type {NS} from './NetscriptDefinitions';
import {log} from './lib-log';
import {allocateResources} from './lib-allocate-resources';
import type {
  AllocatedResources,
  ActionMap,
  CalculateActionTime,
} from './typings';

const WEAKEN_SCRIPT = 'hack-weaken.js';
const WEAKEN_ACTION = 'weaken';

const HACK_SCRIPT = 'hack-hack.js';
const HACK_ACTION = 'hack';

const GROW_SCRIPT = 'hack-grow.js';
const GROW_ACTION = 'grow';

export const hackCoordinator = async (
  ns: NS,
  targetHost: string,
  usedHome: boolean,
  isDryRun: boolean
) => {
  log(ns, `${targetHost}@hackCoordinator: loop-start`);

  /**
   * drain existing money, while lowering security
   * once it hits rock bottom
   * raise it to .99 and repeat
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
