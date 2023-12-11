import type {NS} from './NetscriptDefinitions';
import {buyServer, upgradeServers} from './lib-servers';
import {buyNode, upgradeNodes} from './lib-nodes';
import {autoRootHosts} from './lib-auto-root-hosts';
import {log} from './lib-log';
import {StatusReport} from './typings';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.clearLog();
  ns.print(`started@${new Date()}`);

  ns.exec('exec-hack-all.js', 'home', 1);
  ns.exec('exec-monitor-fleet.js', 'home', 1);
  ns.exec('exec-monitor-host.js', 'home', 1);

  let tick = 0;
  const TEN_MINUTES = 600;

  const logPositiveStatus = (status: StatusReport) => {
    if (status[0]) {
      log(ns, status[1]);
    }
  };

  while (true) {
    autoRootHosts(ns);
    logPositiveStatus(buyServer(ns));
    upgradeServers(ns).forEach(status => logPositiveStatus(status));

    if (tick % TEN_MINUTES === 0) {
      logPositiveStatus(buyNode(ns));
      upgradeNodes(ns).forEach(status => logPositiveStatus(status));
    }

    tick += 1;
    await ns.sleep(1000);
  }
}
