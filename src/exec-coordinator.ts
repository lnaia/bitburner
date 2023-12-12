import type {NS} from './NetscriptDefinitions';
import {buyServer, upgradeServers} from './lib-shop-servers';
import {buyNode, upgradeNodes} from './lib-shop-nodes';
import {autoRootHosts} from './lib-auto-root-hosts';
import {log} from './lib-log';
import type {StatusReport} from './typings';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.clearLog();

  const logPositiveStatus = (status: StatusReport) => {
    if (status[0]) {
      log(ns, status[1]);
    }
  };

  log(ns, 'started');

  const ONE_SECOND = 1000;
  while (true) {
    autoRootHosts(ns);

    // Hacknet changes are good in the short term to generate passive income
    // Servers are more powerfull in the long term
    // with significant ram upgrades and powerful scripts running.
    logPositiveStatus(buyNode(ns));
    upgradeNodes(ns).forEach(status => logPositiveStatus(status));

    logPositiveStatus(buyServer(ns));
    upgradeServers(ns).forEach(status => logPositiveStatus(status));

    await ns.sleep(ONE_SECOND);
  }
}
