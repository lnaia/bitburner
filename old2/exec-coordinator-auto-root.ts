import type {NS} from './NetscriptDefinitions';
import {autoRootHosts} from './lib-auto-root-hosts';
import {log} from './lib-log';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.clearLog();

  log(ns, 'started');

  const ONE_SECOND = 1000;
  while (true) {
    autoRootHosts(ns);

    await ns.sleep(ONE_SECOND);
  }
}
