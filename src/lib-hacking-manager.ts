import type {NS} from './NetscriptDefinitions';
import {allocateResources} from './lib-allocate-resources';

export const msToHMS = (ms: number) => {
  // 1- Convert to seconds:
  let seconds = ms / 1000;
  // 2- Extract hours:
  const hours = seconds / 3600; // 3,600 seconds in 1 hour
  seconds = seconds % 3600; // seconds remaining after extracting hours
  // 3- Extract minutes:
  const minutes = seconds / 60; // 60 seconds in 1 minute
  // 4- Keep only seconds not extracted to minutes:
  seconds = seconds % 60;
  return `${hours}:${minutes}:${seconds}`;
};

export const calculateWeakensRequired = (ns: NS, host: string) => {
  const minSecurity = ns.getServerMinSecurityLevel(host);
  const currSec = +ns.getServerSecurityLevel(host).toFixed(4);
  const weakenAmountPerThread = ns.weakenAnalyze(1);
  const securityToBeReduced = Math.ceil(currSec - minSecurity);

  let weakensRequired = 0;
  if (securityToBeReduced > 0) {
    weakensRequired = Math.ceil(securityToBeReduced / weakenAmountPerThread);
  }

  ns.print(`${host}: weakensRequired=${weakensRequired}`);
  return weakensRequired;
};

export const calculateGrowthsRequired = (ns: NS, host: string) => {
  const maxMoney = ns.getServerMaxMoney(host);
  let currMoney = ns.getServerMoneyAvailable(host);
  if (currMoney <= 0) {
    currMoney = 1;
  }
  const requiredThreads = Math.ceil(
    ns.growthAnalyze(host, maxMoney / currMoney)
  );

  ns.print(`${host}: requiredThreads=${requiredThreads}`);
  return requiredThreads;
};

export const calculateHacksRequired = (ns: NS, host: string) => {
  const currMoney = ns.getServerMoneyAvailable(host);
  const hacksRequired = ns.hackAnalyzeThreads(host, currMoney);

  if (hacksRequired === -1) {
    return 0;
  }

  ns.print(`${host}: hacksRequired=${hacksRequired}`);
  return hacksRequired;
};

export const getScripts = (ns: NS) => {
  const hackScript = 'hack-hack.js';
  const growScript = 'hack-grow.js';
  const weakenScript = 'hack-weaken.js';

  [hackScript, growScript, weakenScript].forEach(script => {
    if (!ns.fileExists(script)) {
      ns.print('missing hacking script');
      ns.exit();
    }
  });

  return {
    HACK: {
      script: hackScript,
      ram: ns.getScriptRam(hackScript),
    },
    GROW: {
      script: hackScript,
      ram: ns.getScriptRam(growScript),
    },
    WEAKEN: {
      script: weakenScript,
      ram: ns.getScriptRam(weakenScript),
    },
  };
};

export const hackingManager = async (
  ns: NS,
  targetHost: string,
  dryRun = true
) => {
  ns.disableLog('ALL');

  await weakenTarget(ns, targetHost, dryRun);
  await growTarget(ns, targetHost, dryRun);
  await weakenTarget(ns, targetHost, dryRun);
  await hackTarget(ns, targetHost, dryRun);
};

export const weakenTarget = async (
  ns: NS,
  targetHost: string,
  dryRun = true
) => {
  const SCRIPTS = getScripts(ns);

  // with one thread
  const threadsRequird = calculateWeakensRequired(ns, targetHost);
  let actionTime = 0;
  if (threadsRequird) {
    actionTime = Math.round(ns.getWeakenTime(targetHost));
    ns.print(`weakenTarget actionTime(s)=${Math.round(actionTime) / 1000}`);
  }

  let [resources, totalThreadsAvailable] = allocateResources(
    ns,
    SCRIPTS.WEAKEN.script,
    SCRIPTS.WEAKEN.ram,
    threadsRequird
  );

  while (totalThreadsAvailable < threadsRequird) {
    ns.print(
      `waiting for resources threadsRequird=${threadsRequird}, totalThreadsAvailable:${totalThreadsAvailable}`
    );
    [resources, totalThreadsAvailable] = allocateResources(
      ns,
      SCRIPTS.WEAKEN.script,
      SCRIPTS.WEAKEN.ram,
      threadsRequird
    );

    await ns.sleep(1000);
  }

  ns.print(
    `threadsRequird=${threadsRequird}, resources available: ${JSON.stringify(
      resources
    )}`
  );

  // upload hack scripts to resources
  const files = [
    SCRIPTS.WEAKEN.script,
    SCRIPTS.GROW.script,
    SCRIPTS.HACK.script,
  ];
  Object.entries(resources).forEach(([host, threads]) => {
    if (host !== 'home') {
      files.forEach(file => {
        if (!ns.fileExists(file, host)) {
          ns.scp(files, host);
        }
      });
    }
    const args = [targetHost, threads];
    if (!dryRun) {
      ns.exec(SCRIPTS.WEAKEN.script, host, threads, ...args);
    } else {
      ns.print(
        `dryRun: ${JSON.stringify([
          SCRIPTS.WEAKEN.script,
          host,
          threads,
          ...args,
        ])}`
      );
    }
  });

  const totalSeconds = Math.round(actionTime / 1000);
  const totalMinutes = Math.round(actionTime / 1000 / 60);
  const totalHours = Math.round(actionTime / 1000 / 60 / 60);

  ns.print(
    `waking up from weaken in: seconds=${totalSeconds} or minutes=${totalMinutes} or hours=${totalHours}`
  );

  let currentSecurityLevel = ns.getServerSecurityLevel(targetHost);
  const minSecurityLevel = ns.getServerMinSecurityLevel(targetHost);
  await ns.sleep(actionTime + 1000);

  ns.print('weaken sucess');
  ns.print(
    `target sec lvl: curr=${currentSecurityLevel} min=${minSecurityLevel}`
  );
};

export const growTarget = async (ns: NS, targetHost: string, dryRun = true) => {
  const SCRIPTS = getScripts(ns);
  const threadsRequired = calculateGrowthsRequired(ns, targetHost);
  let actionTime = 0;
  if (threadsRequired) {
    actionTime = Math.round(ns.getGrowTime(targetHost));
    ns.print(`growTarget actionTime(s)=${Math.round(actionTime) / 1000}`);
  }

  let [resources, totalThreadsAvailable] = allocateResources(
    ns,
    SCRIPTS.GROW.script,
    SCRIPTS.GROW.ram,
    threadsRequired
  );

  while (totalThreadsAvailable < threadsRequired) {
    ns.print(
      `waiting for resources threadsRequired=${threadsRequired}, totalThreadsAvailable:${totalThreadsAvailable}`
    );
    [resources, totalThreadsAvailable] = allocateResources(
      ns,
      SCRIPTS.GROW.script,
      SCRIPTS.GROW.ram,
      threadsRequired
    );

    await ns.sleep(1000);
  }

  ns.print(
    `threadsRequired=${threadsRequired}, resources available: ${JSON.stringify(
      resources
    )}`
  );

  // upload hack scripts to resources
  const files = [
    SCRIPTS.WEAKEN.script,
    SCRIPTS.GROW.script,
    SCRIPTS.HACK.script,
  ];
  Object.entries(resources).forEach(([host, threads]) => {
    if (host !== 'home') {
      files.forEach(file => {
        if (!ns.fileExists(file, host)) {
          ns.scp(files, host);
        }
      });
    }
    const args = [targetHost, threads];
    if (!dryRun) {
      ns.exec(SCRIPTS.GROW.script, host, threads, ...args);
    } else {
      ns.print(
        `dryRun: ${JSON.stringify([
          SCRIPTS.GROW.script,
          host,
          threads,
          ...args,
        ])}`
      );
    }
  });

  const totalSeconds = Math.round(actionTime / 1000);
  const totalMinutes = Math.round(actionTime / 1000 / 60);
  const totalHours = Math.round(actionTime / 1000 / 60 / 60);

  ns.print(
    `waking up from grow in: seconds=${totalSeconds} or minutes=${totalMinutes} or hours=${totalHours}`
  );

  await ns.sleep(actionTime + 1000);

  ns.print('grow sucess');
  ns.print(
    `target money: curr=${ns.getServerMoneyAvailable(
      targetHost
    )} max=${ns.getServerMaxMoney(targetHost)}`
  );
};

export const hackTarget = async (ns: NS, targetHost: string, dryRun = true) => {
  const SCRIPTS = getScripts(ns);

  // with one thread
  const threadsRequired = calculateHacksRequired(ns, targetHost);
  let actionTime = 0;
  if (threadsRequired) {
    actionTime = Math.round(ns.getHackTime(targetHost));
    ns.print(`hackTarget actionTime(s)=${Math.round(actionTime) / 1000}`);
  }

  let [resources, totalThreadsAvailable] = allocateResources(
    ns,
    SCRIPTS.HACK.script,
    SCRIPTS.HACK.ram,
    threadsRequired
  );

  while (totalThreadsAvailable < threadsRequired) {
    ns.print(
      `hackTarget waiting for resources threadsRequired=${threadsRequired}, totalThreadsAvailable:${totalThreadsAvailable}`
    );
    [resources, totalThreadsAvailable] = allocateResources(
      ns,
      SCRIPTS.HACK.script,
      SCRIPTS.HACK.ram,
      threadsRequired
    );

    await ns.sleep(1000);
  }

  ns.print(
    `hackTarget threadsRequired=${threadsRequired}, resources available: ${JSON.stringify(
      resources
    )}`
  );

  // upload hack scripts to resources
  const files = [
    SCRIPTS.WEAKEN.script,
    SCRIPTS.GROW.script,
    SCRIPTS.HACK.script,
  ];
  Object.entries(resources).forEach(([host, threads]) => {
    if (host !== 'home') {
      files.forEach(file => {
        if (!ns.fileExists(file, host)) {
          ns.scp(files, host);
        }
      });
    }
    const args = [targetHost, threads];
    if (!dryRun) {
      ns.exec(SCRIPTS.HACK.script, host, threads, ...args);
    } else {
      ns.print(
        `dryRun: ${JSON.stringify([
          SCRIPTS.HACK.script,
          host,
          threads,
          ...args,
        ])}`
      );
    }
  });

  const totalSeconds = Math.round(actionTime / 1000);
  const totalMinutes = Math.round(actionTime / 1000 / 60);
  const totalHours = Math.round(actionTime / 1000 / 60 / 60);

  ns.print(
    `waking up from hack in: seconds=${totalSeconds} or minutes=${totalMinutes} or hours=${totalHours}`
  );

  await ns.sleep(actionTime + 1000);

  ns.print('hack sucess');
  ns.print(
    `target money: curr=${ns.getServerMoneyAvailable(
      targetHost
    )} max=${ns.getServerMaxMoney(targetHost)}`
  );
};
