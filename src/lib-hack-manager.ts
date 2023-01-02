import type {NS} from './NetscriptDefinitions';
import {allocateResources} from './lib-allocate-resources';

export const isTargetAtMinSecurity = (ns: NS, targetHost: string) => {
  ns.disableLog('ALL');
  const securityMargin = 5;
  const minSecurity = ns.getServerMinSecurityLevel(targetHost);
  const currSecurity = ns.getServerSecurityLevel(targetHost);
  const isSecurityMin = securityMargin + currSecurity >= minSecurity;

  ns.print(
    `${targetHost}@isTargetAtMinSecurity: isSecurityMin=${isSecurityMin}`
  );

  return isSecurityMin;
};

export const isTargetAtMaxMoney = (ns: NS, targetHost: string) => {
  ns.disableLog('ALL');

  const moneyMargin = 10000;
  const moneyAvailable = ns.getServerMoneyAvailable(targetHost);
  const maxMoney = ns.getServerMaxMoney(targetHost);
  const isMoneyMaxed = moneyMargin + moneyAvailable >= maxMoney;

  ns.print(`${targetHost}@isTargetAtMaxMoney: isMoneyMaxed=${isMoneyMaxed}`);

  return isMoneyMaxed;
};

export const calcWeakensToMinSec = (ns: NS, host: string) => {
  ns.disableLog('ALL');
  const minSecurity = ns.getServerMinSecurityLevel(host);
  const currSec = +ns.getServerSecurityLevel(host).toFixed(4);
  const weakenAmountPerThread = ns.weakenAnalyze(1);
  const securityToBeReduced = Math.ceil(currSec - minSecurity);

  let weakensRequired = 0;
  if (securityToBeReduced > 0) {
    weakensRequired = Math.ceil(securityToBeReduced / weakenAmountPerThread);
  }

  ns.print(`${host}@calcWeakensToMinSec: weakensRequired=${weakensRequired}`);
  return weakensRequired;
};

export const getResources = async (
  ns: NS,
  weakenScript: string,
  weakenScriptRam: number,
  threads: number
) => {
  ns.disableLog('ALL');
  const f = () => allocateResources(ns, weakenScript, weakenScriptRam, threads);

  let [resources, totalThreadsAvailable] = f();
  while (totalThreadsAvailable < threads) {
    ns.print(
      `getResources: waiting threads=${threads}, totalThreadsAvailable=${totalThreadsAvailable}`
    );
    [resources, totalThreadsAvailable] = f();
    await ns.sleep(1000);
  }

  return [resources, totalThreadsAvailable];
};

export const ensureScriptIsPresent = (ns: NS, host: string, script: string) => {
  if (!ns.fileExists(script, host)) {
    ns.scp(script, host, 'home');
  }
};

export const dispatchScriptToResources = () => {};
export const lowerTargetSecurity = async (
  ns: NS,
  targetHost: string,
  threads: number,
  isDryRun = false
) => {
  ns.disableLog('ALL');
  const weakenScript = 'hack-weaken.js';
  const weakenScriptRam = ns.getScriptRam(weakenScript);

  ensureScriptIsPresent(ns, targetHost, weakenScript);
  const [resources] = await getResources(
    ns,
    weakenScript,
    weakenScriptRam,
    threads
  );

  Object.entries(resources).forEach(([host, threads]) => {
    const execArgs = [
      weakenScript,
      targetHost,
      threads,
      // args:
      targetHost,
      threads,
    ];

    if (isDryRun) {
      ns.print(`dryRun: ${JSON.stringify(execArgs)}`);
    } else {
      ns.exec(...execArgs);
    }
  });

  await ns.sleep(1000);
};

export const weakenTarget = async (ns: NS, targetHost: string) => {
  ns.disableLog('ALL');
  let weakensToMinSec = calcWeakensToMinSec(ns, targetHost);

  while (!isTargetAtMinSecurity(ns, targetHost)) {
    weakensToMinSec = calcWeakensToMinSec(ns, targetHost);
    await lowerTargetSecurity(ns, targetHost, weakensToMinSec);
    await ns.sleep(1000);
  }
};

export const hackManager = (ns: NS, targetHost: string) => {};
