import type {NS} from './NetscriptDefinitions';
import {buyServer, upgradeServers} from './lib-servers';
import {buyNode, upgradeNodes} from './lib-nodes';
import {autoRootHosts} from './lib-auto-root-hosts';
import {autoProvisionHosts} from './lib-auto-provision-hosts';

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

    await ns.sleep(3000);
  }
}
