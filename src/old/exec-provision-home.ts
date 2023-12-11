import {calculateThreads} from './lib-calculate-threads';
import {listHackableHosts} from './lib-hackable-hosts';
import {HACK_SCRIPT, COORDINATOR_SCRIPT} from './constants.js';
import type {NS} from './NetscriptDefinitions';

export async function main(ns: NS) {
  let targetHost = ns.args[0];
  if (!targetHost) {
    targetHost = listHackableHosts(ns)[0].host;
  }

  // kill all running hack scripts
  ns.ps('home').forEach(runningScript => {
    const isHackScript = new RegExp(HACK_SCRIPT).test(runningScript.filename);
    if (isHackScript) {
      ns.kill(runningScript.pid);
    }
  });

  const script = HACK_SCRIPT;
  const scriptMemory = ns.getScriptRam(script);
  const reserveRam = ns.getScriptRam(COORDINATOR_SCRIPT) * 5;
  const numThreads = calculateThreads(ns, scriptMemory, 'home', reserveRam);

  ns.spawn(script, numThreads, targetHost);
}
