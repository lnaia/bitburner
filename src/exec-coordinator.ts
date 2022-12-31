import type {NS} from './NetscriptDefinitions';

import {
  buyServer,
  upgradeServers,
  buyNode,
  upgradeNodes,
  autoRootHosts,
  autoProvisionHosts,
} from './lib';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.clearLog();
  ns.print(`started@${new Date()}`);

  while (true) {
    buyServer(ns);
    upgradeServers(ns);
    buyNode(ns);
    upgradeNodes(ns);
    autoRootHosts(ns);
    autoProvisionHosts(ns);

    await ns.sleep(1000);
  }
}
