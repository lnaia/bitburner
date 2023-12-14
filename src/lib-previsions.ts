import type {NS} from './NetscriptDefinitions';
import {HOME_SERVER, SCRIPT_HACK} from './constants';
import {log} from './lib-log';

export const previsions = async (ns: NS) => {
  const targetHost = 'n00dles';
  const hackAmount = ns.getServerMoneyAvailable(targetHost) * 0.1;

  const hackTreads = ns.hackAnalyzeThreads(targetHost, hackAmount);
  const hackTime = ns.getHackTime(targetHost) * hackTreads;

  const data = {
    hackAmount,
    hackTreads,
    hackTime,
    realHackTime: -1,
  };

  const beforeHack = new Date();
  const pid = ns.exec(SCRIPT_HACK, HOME_SERVER, {threads: hackTreads});
  while (ns.isRunning(pid)) {
    await ns.sleep(100);
  }

  const afterHack = new Date();
  data.realHackTime = afterHack.getTime() - beforeHack.getTime();

  log(ns, JSON.stringify(data));
};
