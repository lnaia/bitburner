import {calculateThreads, listHackableHosts} from './lib';
import {HACK_SCRIPT} from './constants.js';
import type {NS} from './NetscriptDefinitions';

export async function main(ns: NS) {
  ns.disableLog('ALL');

  let targetHost = ns.args[0];
  if (!targetHost) {
    targetHost = listHackableHosts(ns)[0].host;
  }

  // kill all running hack scripts
  ns.ps().forEach(runningScript => {
    const isHackScript = /hack\.js$/.test(runningScript.filename);
    if (isHackScript) {
      ns.kill(runningScript.pid);
    }
  });

  const script = HACK_SCRIPT;
  const scriptMemory = ns.getScriptRam(script);
  const reserveRam = ns.getScriptRam('exec-coordinator.js');
  const numThreads = calculateThreads(ns, scriptMemory, 'home', reserveRam);

  ns.spawn(script, numThreads, targetHost);
}
