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

export const hackingManager = async (
  ns: NS,
  targetHost: string,
  dryRun = true
) => {
  ns.disableLog('scp');
  ns.disableLog('scan');
  ns.disableLog('sleep');
  ns.disableLog('getServerMaxRam');
  ns.disableLog('getServerUsedRam');
  ns.disableLog('getServerRequiredHackingLevel');
  ns.disableLog('getHackingLevel');

  const SCRIPTS = (() => {
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
  })();

  // with one thread
  const weakensRequired = calculateWeakensRequired(ns, targetHost);
  let totalWeakenTime = 0;
  if (weakensRequired) {
    const weakenTime = Math.round(ns.getWeakenTime(targetHost));
    totalWeakenTime = weakenTime * weakensRequired;
    ns.print(`weakenTime=${weakenTime}`);
  }

  const resources = allocateResources(
    ns,
    SCRIPTS.WEAKEN.script,
    SCRIPTS.WEAKEN.ram,
    weakensRequired
  );

  ns.print(
    `weakensRequired=${weakensRequired}, resources available: ${JSON.stringify(
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

  const totalSeconds = Math.round(totalWeakenTime / 1000);
  const totalMinutes = Math.round(totalWeakenTime / 1000 / 60);
  const totalHours = Math.round(totalWeakenTime / 1000 / 60 / 60);

  ns.print(
    `waking up from weaken in: seconds=${totalSeconds} or minutes=${totalMinutes} or hours=${totalHours}`
  );

  const safetyMargin = 5000;
  await ns.sleep(totalWeakenTime + safetyMargin);

  const currentSecurityLevel = ns.getServerSecurityLevel(targetHost);
  const minSecurityLevel = ns.getServerMinSecurityLevel(targetHost);
  ns.print(
    `target security level: curr=${currentSecurityLevel} min=${minSecurityLevel}`
  );
};
