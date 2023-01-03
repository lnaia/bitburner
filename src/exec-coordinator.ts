import type {NS} from './NetscriptDefinitions';
import {buyServer, upgradeServers} from './lib-servers';
import {buyNode, upgradeNodes} from './lib-nodes';
import {autoRootHosts} from './lib-auto-root-hosts';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.clearLog();
  ns.print(`started@${new Date()}`);

  ns.exec('exec-hack-all.js', 'home', 1);

  while (true) {
    buyServer(ns);
    upgradeServers(ns);
    buyNode(ns);
    upgradeNodes(ns);
    autoRootHosts(ns);

    await ns.sleep(1000);
  }
}
