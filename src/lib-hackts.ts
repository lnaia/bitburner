import type {NS} from './NetscriptDefinitions';

export const HACK_SCRIPT = 'hack-weaken.js';

export const stopConditionHack = (ns: NS, targetHost: string) => {
  ns.disableLog('ALL');
  const safetyMargin = 1000;
  const moneyAvailable = ns.getServerMoneyAvailable(targetHost);
  const isTargetRich = moneyAvailable <= safetyMargin;

  // ns.print(`${targetHost}@stopConditionHack: ${isTargetRich}`);
  return isTargetRich;
};

export const calculateThreadsHack = (ns: NS, host: string) => {
  ns.disableLog('ALL');
  const currMoney = ns.getServerMoneyAvailable(host);
  const requiredThreads = Math.ceil(ns.hackAnalyzeThreads(host, currMoney));

  if (requiredThreads === -1) {
    return 0;
  }

  // ns.print(`${host}@calculateThreadsHack: requiredThreads=${requiredThreads}`);
  return requiredThreads;
};
