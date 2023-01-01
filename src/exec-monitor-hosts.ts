import {discoverHosts} from './lib-discover-hosts';
import {hostInfo} from './lib-host-info';
import {printObjList} from './lib-print-obj-list.js';
import type {NS} from './NetscriptDefinitions';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.tail();

  const maxHosts = +ns.args[0];
  const sortOrder = `${ns.args[1]}`;

  while (true) {
    const list = (() => {
      const hosts = discoverHosts(ns)
        .map(host => hostInfo(ns, host))
        .filter(host => host.mm > 0)
        .sort((a, b) => {
          if (sortOrder === 'cm') {
            return b.cm - a.cm;
          } else if (sortOrder === 'rh') {
            return b.rh - a.rh;
          } else if (sortOrder === 'ms') {
            return b.ms - a.ms;
          }

          return b.mm - a.mm;
        });
      if (maxHosts > 0) {
        return hosts.slice(0, maxHosts);
      }

      return hosts;
    })();

    ns.clearLog();
    ns.print(new Date());
    printObjList(list, ns.print);
    await ns.sleep(1000);
  }
}
