import type {NS} from './NetscriptDefinitions';

const resources = {
  a: 100,
  b: 50,
};

/** @param {NS} ns */
export async function main(ns: NS) {
  const needs = 111;

  ns.exit();
  const host = ns.args[0].toString();

  const minSecurity = ns.getServerMinSecurityLevel(host);
  const currSec = ns.getServerSecurityLevel(host).toFixed(4);
  const weakenAmountPerThread = ns.weakenAnalyze(1);
  const weakenTime = ns.getWeakenTime(host);

  // how many weakens to bring it to the minimum
  // also how many threads
  const securityToBeReduced = Math.round(currSec - minSecurity);

  let weakensRequired = 0;
  let totalWeakenTime = 0;
  if (securityToBeReduced > 0) {
    weakensRequired = Math.ceil(securityToBeReduced / weakenAmountPerThread);
    totalWeakenTime = weakenTime * weakensRequired; // in milli
  }

  const availableRam = ns.getServerMaxRam('home') - ns.getServerUsedRam('home');
  const threadsAvailable = Math.floor(
    availableRam / ns.getScriptRam('weaken.js')
  );
  const threadsRemaining = threadsAvailable - weakensRequired;
  const weakenTimeSeconds = Math.round(weakenTime / 1000);

  const report = {
    host,
    minSecurity,
    currSec,
    securityToBeReduced,
    weakenAmountPerThread,
    weakenTimeSeconds,
    totalWeakenTimeInSeconds: Math.round(totalWeakenTime / 1000),
    weakensRequired,
    threadsAvailable,
    threadsRemaining,
    availableRam,
    'inASingleScript?': weakensRequired > threadsAvailable,
  };

  ns.tprint(JSON.stringify(report, null, 2));
  // ns.exit()

  if (weakensRequired <= 0) {
    ns.tprint('target ready - no need to weaken further');
    ns.exit();
  }

  const args = [host, weakensRequired];
  ns.exec('weaken.js', 'home', weakensRequired, ...args);

  const minutes = weakenTimeSeconds / 60;
  const hours = minutes / 60;

  ns.tprint(`sleeping now... will wake up in:`);
  ns.tprint(
    JSON.stringify(
      {
        seconds: weakenTimeSeconds,
        minutes,
        hours,
      },
      null,
      2
    )
  );

  await ns.sleep(weakenTime + 5000);

  ns.tprint(
    JSON.stringify(
      {
        currentSecurity: ns.getServerSecurityLevel(host),
      },
      null,
      2
    )
  );
}
