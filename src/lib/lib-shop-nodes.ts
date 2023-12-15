import { NS } from "@ns";
import type { StatusReport } from "typings";
import { HOME_SERVER } from "constants";

export const buyNode = (ns: NS): StatusReport => {
  const cost = ns.hacknet.getPurchaseNodeCost();
  const availableFunds = ns.getServerMoneyAvailable(HOME_SERVER);
  if (availableFunds >= cost) {
    ns.hacknet.purchaseNode();
    return [true, "buyNode: success"];
  }

  return [false, "buyNode: failed, not enough funds"];
};

const upgradeNode = (ns: NS, nodeIndex: number): StatusReport => {
  const upgradeType: string[] = [];
  const availableFunds = () => ns.getServerMoneyAvailable(HOME_SERVER);

  const upgradeRam = () => {
    const costs = ns.hacknet.getRamUpgradeCost(nodeIndex, 1);
    if (availableFunds() >= costs) {
      ns.hacknet.upgradeRam(nodeIndex, 1);
      upgradeType.push("ram");
    }
  };

  const upgradeLevel = () => {
    const costs = ns.hacknet.getLevelUpgradeCost(nodeIndex, 1);
    if (availableFunds() >= costs) {
      ns.hacknet.upgradeLevel(nodeIndex, 1);
      upgradeType.push("level");
    }
  };

  const upgradeCore = () => {
    const costs = ns.hacknet.getCoreUpgradeCost(nodeIndex, 1);
    if (availableFunds() >= costs) {
      ns.hacknet.upgradeCore(nodeIndex, 1);
      upgradeType.push("core");
    }
  };

  upgradeRam();
  upgradeLevel();
  upgradeCore();

  return [upgradeType.length > 0, `${nodeIndex}:${upgradeType.join(", ")}`];
};

export const upgradeNodes = (ns: NS): StatusReport[] => {
  const statusReports: StatusReport[] = [];
  const nodes = ns.hacknet.numNodes();
  for (let i = 0; i < nodes; i += 1) {
    statusReports.push(upgradeNode(ns, i));
  }

  return statusReports;
};
