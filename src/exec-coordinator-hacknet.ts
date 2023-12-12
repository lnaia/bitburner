import type {NS} from './NetscriptDefinitions';
import {buyNode, upgradeNodes} from './lib-shop-nodes';
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
    logPositiveStatus(buyNode(ns));
    upgradeNodes(ns).forEach(status => logPositiveStatus(status));
    await ns.sleep(ONE_SECOND);
  }
}
