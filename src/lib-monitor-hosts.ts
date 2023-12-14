import {discoverHosts} from './lib-discover-hosts';
import {hostInfo} from './lib-host-info';
import {printObjList} from './lib-print-obj-list.js';
import {log} from './lib-log';
import type {NS} from './NetscriptDefinitions';

type Props = {
  ns: NS;
  maxHosts?: number;
  sortOrder?: string;
  invert?: boolean;
  name?: string;
};
export const monitorHosts = ({
  ns,
  maxHosts,
  sortOrder,
  invert,
  name,
}: Props) => {
  let hosts = discoverHosts(ns)
    .map(host => hostInfo(ns, host))
    .filter(host => host.mm > 0);

  if (maxHosts > 0) {
    hosts = hosts.slice(0, maxHosts);
  }

  if (invert) {
    hosts = hosts.reverse();
  }

  if (typeof name === 'string' && name.length) {
    hosts = hosts.filter(host => new RegExp(name).test(host.host));
  }

  const list = hosts
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
      const {host, hmm, hcm, diff, rh, ms, cs, hc} = hostDetails;
      return {
        host,
        hmm,
        hcm,
        diff,
        ms,
        cs,
        rh,
        hc,
      };
    });

  ns.clearLog();
  log(ns, 'monitor-hosts');
  const print = ns.print.bind(ns);
  printObjList(list, print);
};