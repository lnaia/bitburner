import type {NS} from './NetscriptDefinitions';
import {monitorHost} from './lib-monitor-hosts';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.clearLog();
  ns.tail();

  const [name] = ns.args;
  await monitorHost(ns, `${name}`);
}
