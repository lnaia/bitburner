import type {NS} from './NetscriptDefinitions';
import {HOME_SERVER, SCRIPT_HACK} from './constants';
import {log} from './lib-log';
import {humanReadableMoney} from './lib-human-readable-money';

export const previsions = async (ns: NS) => {
  const targetHost = 'n00dles';
  const hackAmount = ns.getServerMoneyAvailable(targetHost) * 0.1;

  const hackTreads = Math.ceil(ns.hackAnalyzeThreads(targetHost, hackAmount));
  const hackTime = Math.ceil((ns.getHackTime(targetHost) * hackTreads) / 1000);
  const beforeMoney = ns.getServerMoneyAvailable(targetHost);

  const data = {
    beforeMoney: humanReadableMoney(beforeMoney),
    afterMoney: '',
    diffMoney: '',
    hackAmount: humanReadableMoney(hackAmount),
    hackTreads,
    hackTime,
    realHackTime: -1,
  };

  const beforeHack = new Date();
  const scriptArgs = [targetHost, hackTreads];
  const pid = ns.exec(SCRIPT_HACK, HOME_SERVER, hackTreads, ...scriptArgs);
  while (ns.isRunning(pid)) {
    await ns.sleep(100);
  }

  const afterHack = new Date();
  const afterMoney = ns.getServerMoneyAvailable(targetHost);
  data.realHackTime = (afterHack.getTime() - beforeHack.getTime()) / 1000;
  data.afterMoney = humanReadableMoney(afterMoney);
  data.diffMoney = humanReadableMoney(beforeMoney - afterMoney);
  log(ns, JSON.stringify(data, null, 2));
};
