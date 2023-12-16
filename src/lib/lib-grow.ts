import { NS } from "@ns";

export const stopConditionGrow = (ns: NS, host: string) => {
  const moneyAvailable = ns.getServerMoneyAvailable(host);
  const maxMoney = ns.getServerMaxMoney(host);
  const isMoneyMaxed = moneyAvailable >= maxMoney;

  return isMoneyMaxed;
};

type Props = {
  ns: NS;
  host: string;
  moneyThatWillBeStolen?: number;
};
export const calculateThreadsGrow = ({
  ns,
  host,
  moneyThatWillBeStolen = 0,
}: Props) => {
  const maxMoney = ns.getServerMaxMoney(host);
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
