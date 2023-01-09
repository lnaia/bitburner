import type {NS} from './NetscriptDefinitions';
import {unlockResources} from './lib-resources';
import {log} from './lib-log';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  await ns.sleep(3000);
  if (!unlockResources(ns)) {
    log(ns, 'exec-unlock-resources: warning - unable to unlock resources?');
  } else {
    log(ns, 'exec-unlock-resources: resources unlocked');
  }
}
