import type {NS} from './NetscriptDefinitions';
import {hackingManager} from './lib-hacking-manager.js';

export async function main(ns: NS) {
  const host = ns.args[0].toString();

  while (true) {
    await hackingManager(ns, host, false);
    await ns.sleep(1000);
  }
}
