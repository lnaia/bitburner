import { NS } from "@ns";
import type { StatusReport } from "typings";
import { HACKNET_NODE_PREFIX, HOME_SERVER } from "constants";
import { provisionHost } from "lib/lib-provisioning";
import { log } from "./lib-log";

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

const availableFunds = (ns: NS) => ns.getServerMoneyAvailable(HOME_SERVER);

const upgradeRam = (ns: NS, nodeIndex: number) => {
  const costs = ns.hacknet.getRamUpgradeCost(nodeIndex, 1);
  if (availableFunds(ns) >= costs) {
    const result = ns.hacknet.upgradeRam(nodeIndex, 1);
    log(ns, `${nodeIndex}@upgradeRam result:${result}`);
  }
};

const upgradeLevel = (ns: NS, nodeIndex: number) => {
  const costs = ns.hacknet.getLevelUpgradeCost(nodeIndex, 1);
  if (availableFunds(ns) >= costs) {
    const result = ns.hacknet.upgradeLevel(nodeIndex, 1);
    log(ns, `${nodeIndex}@upgradeLevel result:${result}`);
  }
};

const upgradeCore = (ns: NS, nodeIndex: number) => {
  const costs = ns.hacknet.getCoreUpgradeCost(nodeIndex, 1);
  if (availableFunds(ns) >= costs) {
    const result = ns.hacknet.upgradeCore(nodeIndex, 1);
    log(ns, `${nodeIndex}@upgradeCore result:${result}`);
  }
};

const upgradeCache = (ns: NS, nodeIndex: number) => {
  const costs = ns.hacknet.getCacheUpgradeCost(nodeIndex, 1);
  if (!isNaN(costs) && costs > 0 && availableFunds(ns) >= costs) {
    const result = ns.hacknet.upgradeCache(nodeIndex, 1);
    log(ns, `${nodeIndex}@upgradeCache result:${result}`);
  }
};

export const enrichNodes = (ns: NS, index: number) => {
  const cacheUpgradeCost = ns.hacknet.getCacheUpgradeCost(index);
  const coreUpgradeCost = ns.hacknet.getCoreUpgradeCost(index);
  const ramUpgradeCost = ns.hacknet.getRamUpgradeCost(index);
  const levelUpgradeCost = ns.hacknet.getLevelUpgradeCost(index);

  return {
    index,
    cacheUpgradeCost,
    coreUpgradeCost,
    ramUpgradeCost,
    levelUpgradeCost,
  };
};

const UPGRADE_TYPE_RAM = "ram";
const UPGRADE_TYPE_CACHE = "cache";
const UPGRADE_TYPE_CORE = "core";
const UPGRADE_TYPE_LEVEL = "level";
export const getNodeList = (ns: NS) => {
  const nodeList = [];
  const nodes = ns.hacknet.numNodes();
  for (let i = 0; i < nodes; i += 1) {
    nodeList.push(enrichNodes(ns, i));
  }

  type UpgradeObj = {
    type: string;
    cost: number;
    node: number;
  };
  return nodeList
    .reduce((nodeUpgradeList: UpgradeObj[], node) => {
      const nodeUpgrades = [
        { type: UPGRADE_TYPE_RAM, cost: node.ramUpgradeCost, node: node.index },
        {
          type: UPGRADE_TYPE_CACHE,
          cost: node.cacheUpgradeCost,
          node: node.index,
        },
        {
          type: UPGRADE_TYPE_CORE,
          cost: node.coreUpgradeCost,
          node: node.index,
        },
        {
          type: UPGRADE_TYPE_LEVEL,
          cost: node.levelUpgradeCost,
          node: node.index,
        },
      ];

      return [...nodeUpgradeList, ...nodeUpgrades];
    }, [])
    .sort((a, b) => b.cost - a.cost);
};

export const upgradeNodesCheapestUpgradeFirst = (ns: NS) => {
  const upgradesList = getNodeList(ns);

  const upgradeTypeMap: { [key: string]: (index: number) => void } = {
    [UPGRADE_TYPE_RAM]: (index: number) => upgradeRam(ns, index),
    [UPGRADE_TYPE_CACHE]: (index: number) => upgradeCache(ns, index),
    [UPGRADE_TYPE_CORE]: (index: number) => upgradeCore(ns, index),
    [UPGRADE_TYPE_LEVEL]: (index: number) => upgradeLevel(ns, index),
  };

  // we give priority to hashes... first.
  upgradesList
    .filter((upgrade) => upgrade.type === UPGRADE_TYPE_CACHE)
    .forEach((upgrade) => {
      upgradeTypeMap[upgrade.type](upgrade.node);
    });

  // then everything else
  upgradesList
    .filter((upgrade) => upgrade.type !== UPGRADE_TYPE_CACHE)
    .forEach((upgrade) => {
      upgradeTypeMap[upgrade.type](upgrade.node);
    });
};
