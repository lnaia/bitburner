import type {NS} from './NetscriptDefinitions';

export async function main(ns: NS) {
  ns.disableLog('ALL');
  ns.clearLog();
}
