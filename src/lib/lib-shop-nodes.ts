import { NS } from "@ns";
import type { StatusReport } from "typings";
import { HACKNET_NODE_PREFIX, HOME_SERVER } from "constants";
import { provisionHost } from "lib/lib-provisioning";

export const buyNode = (ns: NS): StatusReport => {
  const cost = ns.hacknet.getPurchaseNodeCost();
  const availableFunds = ns.getServerMoneyAvailable(HOME_SERVER);
  if (availableFunds >= cost) {
    const nodeId = ns.hacknet.purchaseNode();

    if (nodeId !== -1) {
      provisionHost(ns, `${HACKNET_NODE_PREFIX}-${nodeId}`);
      return [true, "buyNode: success"];
    } else {
      return [false, "buyNode: failed - unknown error"];
    }
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

  const upgradeCache = () => {
    const costs = ns.hacknet.getCacheUpgradeCost(nodeIndex, 1);
    if (!isNaN(costs) && costs > 0 && availableFunds() >= costs) {
      ns.hacknet.upgradeCore(nodeIndex, 1);
      upgradeType.push("cache");
    }
  };

  upgradeRam();
  upgradeLevel();
  upgradeCore();
  upgradeCache();

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
