import type {NS} from './NetscriptDefinitions';
import {resourceManager} from './lib-resources';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.clearLog();
  ns.tail();

  resourceManager(ns);
}
