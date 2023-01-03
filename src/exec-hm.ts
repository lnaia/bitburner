import type {NS} from './NetscriptDefinitions';
import {hackManager} from './lib-hack-manager.js';

export async function main(ns: NS) {
  const host = ns.args[0].toString();

  while (true) {
    await hackManager(ns, host, true);
    await ns.sleep(1000);
  }
}
