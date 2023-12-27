import { NS } from "@ns";
import { discoverHosts } from "lib/lib-discover-hosts";
import { log } from "lib/lib-log";
import { hostInfo } from "./lib-host-info";

const getHashMaxCount = (ns: NS, upgradeName: string) => {
  const existingHashes = Math.floor(ns.hacknet.numHashes());
  if (existingHashes <= 0) {
    return 0;
  }

  let hashUpgradeCounter = 1;
  let hashUpgradeCost = ns.hacknet.hashCost(upgradeName, hashUpgradeCounter);

  // not enough for a single upgrade
  if (existingHashes < hashUpgradeCost) {
    return 0;
  }

  while (existingHashes >= hashUpgradeCost) {
    hashUpgradeCounter += 1;
    hashUpgradeCost = ns.hacknet.hashCost(upgradeName, hashUpgradeCounter);
  }

  //   log(
  //     ns,
  //     `getHashMaxCount hashUpgradeCounter:${
  //       hashUpgradeCounter - 1
  //     } hashUpgradeCost:${hashUpgradeCost} existingHashes:${existingHashes}`
  //   );

  // always the previous
  return hashUpgradeCounter - 1;
};

export const reduceMinSec = (ns: NS, host: string) => {
  const upgradeName = "Reduce Minimum Security";
  const upgradeCount = getHashMaxCount(ns, upgradeName);

  if (upgradeCount > 0) {
    const result = ns.hacknet.spendHashes(upgradeName, host, upgradeCount);
    log(
      ns,
      `${upgradeName} result:${result} host:${host} upgradeCount:${upgradeCount}`
    );
  }
};

export const spendHashes = (ns: NS) => {
  const hostDetailsList = discoverHosts(ns)
    .filter((host) => ns.hasRootAccess(host))
    .map((host) => hostInfo(ns, host))
    .filter((host) => host.mm > 0 && host.ms >= 4 && host.hc <= 90)
    .sort((a, b) => b.mm - a.mm);

  hostDetailsList.forEach((hostDetails) => {
    reduceMinSec(ns, hostDetails.host);
  });
};
