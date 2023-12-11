import {printObjList} from './lib-print-obj-list.js';
import type {NS} from './NetscriptDefinitions';

/** @param {NS} ns */
export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.tail();

  while (true) {
    ns.clearLog();
    ns.print(new Date());
    const list = ns.getPurchasedServers().map(host => {
      const ram = ns.getServerMaxRam(host);

      return {
        host,
        ram,
      };
    });

    printObjList(list, ns.print);
    await ns.sleep(1000);
  }
}
