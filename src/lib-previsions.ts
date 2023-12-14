import type {NS} from './NetscriptDefinitions';
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
  await ns.hack(targetHost, {threads: hackTreads});
  const afterHack = new Date();

  data.realHackTime = afterHack.getTime() - beforeHack.getTime();

  log(ns, JSON.stringify(data));
};
