import { NS } from "@ns";
const LIMIT_MAX_MONEY_PERCENT = 0.95;

export const stopConditionGrow = (
  ns: NS,
  host: string,
  maxPercent = LIMIT_MAX_MONEY_PERCENT
) => {
  ns.disableLog("ALL");
  const moneyAvailable = ns.getServerMoneyAvailable(host);
  const maxMoney = ns.getServerMaxMoney(host) * maxPercent;
  const isMoneyMaxed = moneyAvailable >= maxMoney;

  return isMoneyMaxed;
};

export const calculateThreadsGrow = (
  ns: NS,
  host: string,
  maxPercent = LIMIT_MAX_MONEY_PERCENT,
  moneyThatWillBeStolen = 0
) => {
  ns.disableLog("ALL");
  const maxMoney = ns.getServerMaxMoney(host) * maxPercent;
  let currMoney = ns.getServerMoneyAvailable(host) - moneyThatWillBeStolen;
  if (currMoney <= 0) {
    currMoney = 1;
  }

  let factor = 1;
  try {
    factor = Math.ceil(maxMoney / currMoney);
  } catch (e) {
    // ignore
    factor = 1;
  }

  return Math.ceil(ns.growthAnalyze(host, factor));
};
