import {discoverHosts} from './lib-discover-hosts';
import {hostInfo} from './lib-host-info';
import {printObjList} from './lib-print-obj-list.js';
import type {NS} from './NetscriptDefinitions';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.tail();

  const maxHosts = +ns.args[0];
  const sortOrder = `${ns.args[1]}`;
  const invert = +ns.args[2];
  const name = ns.args[3] ?? '';

  while (true) {
    const list = (() => {
      let hosts = discoverHosts(ns)
        .map(host => hostInfo(ns, host))
        .filter(host => host.mm > 0);

      if (maxHosts > 0) {
        hosts = hosts.slice(0, maxHosts);
      }

      if (invert === 1) {
        hosts = hosts.reverse();
      }

      if (typeof name === 'string' && name.length) {
        hosts = hosts.filter(host => new RegExp(name).test(host.host));
      }

      return hosts
        .sort((a, b) => {
          if (sortOrder === 'cm') {
            return b.cm - a.cm;
          } else if (sortOrder === 'rh') {
            return b.rh - a.rh;
          } else if (sortOrder === 'ms') {
            return b.ms - a.ms;
          }

          return b.mm - a.mm;
        })
        .map(hostDetails => {
          const {host, hmm, hcm, diff, rh, ms, cs} = hostDetails;
          return {
            host,
            hmm,
            hcm,
            diff,
            ms,
            cs,
            rh,
          };
        });
    })();

    ns.clearLog();
    ns.print(new Date());
    const print = ns.print.bind(ns);
    printObjList(list, print);
    await ns.sleep(1000);
  }
}
