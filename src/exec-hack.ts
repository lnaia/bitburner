import type {NS} from './NetscriptDefinitions';
import {coordinator} from './lib-hack';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.clearLog();
  const host = ns.args[0].toString();

  coordinator(ns, host);
}
