import type {NS} from './NetscriptDefinitions';
import {previsions} from './lib-previsions';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.clearLog();
  ns.tail();

  await previsions(ns);
}
