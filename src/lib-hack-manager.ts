import type {NS} from './NetscriptDefinitions';
import {allocateResources} from './lib-allocate-resources';
import type {AllocatedResources, ActionMap} from './typings';

const WEAKEN_SCRIPT = 'hack-weaken.js';
const WEAKEN_ACTION = 'weaken';

const HACK_SCRIPT = 'hack-hack.js';
const HACK_ACTION = 'hack';

const GROW_SCRIPT = 'hack-grow.js';
const GROW_ACTION = 'grow';

export const stopConditionHack = (ns: NS, targetHost: string) => {
  ns.disableLog('ALL');
  const securityMargin = 10000;
  const moneyAvailable = ns.getServerMoneyAvailable(targetHost);
  const isTargetRich = moneyAvailable + securityMargin >= 0;

  ns.print(`${targetHost}@stopConditionHack: ${isTargetRich}`);

  return isTargetRich;
};

export const stopConditionWeaken = (ns: NS, targetHost: string) => {
  ns.disableLog('ALL');
  const securityMargin = 5;
  const minSecurity = ns.getServerMinSecurityLevel(targetHost);
  const currSecurity = ns.getServerSecurityLevel(targetHost);
  const isSecurityMin = securityMargin + currSecurity >= minSecurity;

  ns.print(`${targetHost}@stopConditionWeaken: ${isSecurityMin}`);

  return isSecurityMin;
};

export const stopConditionGrow = (ns: NS, targetHost: string) => {
  ns.disableLog('ALL');

  const moneyMargin = 10000;
  const moneyAvailable = ns.getServerMoneyAvailable(targetHost);
  const maxMoney = ns.getServerMaxMoney(targetHost);
  const isMoneyMaxed = moneyMargin + moneyAvailable >= maxMoney;

  ns.print(`${targetHost}@stopConditionGrow: ${isMoneyMaxed}`);

  return isMoneyMaxed;
};

export const calculateThreadsWeaken = (ns: NS, host: string) => {
  ns.disableLog('ALL');
  const minSecurity = ns.getServerMinSecurityLevel(host);
  const currSec = +ns.getServerSecurityLevel(host).toFixed(4);
  const weakenAmountPerThread = ns.weakenAnalyze(1);
  const securityToBeReduced = Math.ceil(currSec - minSecurity);

  let requiredThreads = 0;
  if (securityToBeReduced > 0) {
    requiredThreads = Math.ceil(securityToBeReduced / weakenAmountPerThread);
  }

  ns.print(
    `${host}@calculateThreadsWeaken: requiredThreads=${requiredThreads}`
  );
  return requiredThreads;
};

export const calculateThreadsGrow = (ns: NS, host: string) => {
  ns.disableLog('ALL');
  const maxMoney = ns.getServerMaxMoney(host);
  let currMoney = ns.getServerMoneyAvailable(host);
  if (currMoney <= 0) {
    currMoney = 1;
  }
  const requiredThreads = Math.ceil(
    ns.growthAnalyze(host, maxMoney / currMoney)
  );

  ns.print(`${host}@calculateThreadsGrow: requiredThreads=${requiredThreads}`);
  return requiredThreads;
};

export const calculateThreadsHack = (ns: NS, host: string) => {
  ns.disableLog('ALL');
  const currMoney = ns.getServerMoneyAvailable(host);
  const requiredThreads = ns.hackAnalyzeThreads(host, currMoney);

  if (requiredThreads === -1) {
    return 0;
  }

  ns.print(`${host}@calculateThreadsHack: requiredThreads=${requiredThreads}`);
  return requiredThreads;
};

export const ensureScriptIsPresent = (ns: NS, host: string, script: string) => {
  if (!ns.fileExists(script, host)) {
    ns.scp(script, host, 'home');
  }
};

export const cleanupExistingScripts = async (ns: NS, host: string) => {
  ns.disableLog('ALL');

  for (const script of [HACK_SCRIPT, GROW_SCRIPT, WEAKEN_SCRIPT]) {
    if (!ns.fileExists(script, host)) {
      continue;
    }

    const foundScript = ns
      .ps(host)
      .find(runningScript => runningScript.filename === script);

    if (foundScript) {
      ns.kill(foundScript.pid);
      ns.sleep(1000); // wait for kill to do it's thing
    }

    ns.rm(script, host);
  }
};

export const getResources = async (
  ns: NS,
  weakenScript: string,
  weakenScriptRam: number,
  threads: number
): Promise<AllocatedResources> => {
  ns.disableLog('ALL');
  const f = () => allocateResources(ns, weakenScript, weakenScriptRam, threads);

  let [resources, totalThreadsAvailable] = f();
  while (totalThreadsAvailable < 1) {
    ns.print(`getResources: waiting for an available thread`);
    [resources, totalThreadsAvailable] = f();
    await ns.sleep(1000);
  }

  return [resources, totalThreadsAvailable];
};

export const dispatchScriptToResources = (
  ns: NS,
  resources: AllocatedResources[0],
  script: string,
  targetHost: string,
  isDryRun: boolean
) => {
  ns.disableLog('ALL');
  Object.entries(resources).forEach(([host, threads]) => {
    const execArgs: [string, string, number, string, number] = [
      script,
      host,
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
};

export const runScriptAgainstTarget = async (
  ns: NS,
  script: string,
  targetHost: string,
  threads: number,
  isDryRun: boolean
) => {
  ns.disableLog('ALL');
  const scriptRam = ns.getScriptRam(script);
  ensureScriptIsPresent(ns, targetHost, script);
  const [resources] = await getResources(ns, script, scriptRam, threads);
  dispatchScriptToResources(ns, resources, script, targetHost, isDryRun);
};

export const genericAction = async (
  ns: NS,
  targetHost: string,
  action: string,
  isDryRun: boolean
) => {
  ns.disableLog('ALL');

  const actionMap: ActionMap = {
    weaken: {
      stopCondition: stopConditionWeaken,
      calculateThreads: calculateThreadsWeaken,
    },
    grow: {
      stopCondition: stopConditionGrow,
      calculateThreads: calculateThreadsGrow,
    },
    hack: {
      stopCondition: stopConditionHack,
      calculateThreads: calculateThreadsHack,
    },
  };

  const {calculateThreads, stopCondition} = actionMap[action];
  let threadsRequired = calculateThreads(ns, targetHost);
  while (!stopCondition(ns, targetHost)) {
    threadsRequired = calculateThreads(ns, targetHost);
    await runScriptAgainstTarget(
      ns,
      GROW_SCRIPT,
      targetHost,
      threadsRequired,
      isDryRun
    );
    await ns.sleep(1000);
  }
};

export const hackManager = async (
  ns: NS,
  targetHost: string,
  isDryRun: boolean
) => {
  await cleanupExistingScripts(ns, targetHost);

  await genericAction(ns, targetHost, WEAKEN_ACTION, isDryRun);
  await genericAction(ns, targetHost, GROW_ACTION, isDryRun);
  await genericAction(ns, targetHost, WEAKEN_ACTION, isDryRun);
  await genericAction(ns, targetHost, HACK_ACTION, isDryRun);
};