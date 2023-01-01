import {discoverHosts} from './lib-discover-hosts';
import {hostInfo} from './lib-host-info';
import {printObjList} from './lib-print-obj-list.js';
import type {NS} from './NetscriptDefinitions';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.tail();
  while (true) {
    const list = discoverHosts(ns).map(host => hostInfo(ns, host));
    ns.clearLog();
    ns.print(new Date());
    printObjList(list, ns.print);
    await ns.sleep(1000);
  }
}
