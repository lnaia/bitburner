import type {NS} from './NetscriptDefinitions';
import {monitorHosts} from './lib-monitor-hosts';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.tail();

  const [maxHosts, sortOrder, invert, name, clearLog] = ns.args;

  while (true) {
    monitorHosts({
      ns,
      maxHosts: maxHosts ? +maxHosts : -1,
      sortOrder: `${sortOrder ? sortOrder : ''}`,
      invert: Boolean(invert),
      name: `${name ? name : ''}`,
      clearLog: clearLog === '0' ? false : true,
    });

    await ns.sleep(1000);
  }
}
