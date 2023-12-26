import { NS } from "@ns";
import { discoverHosts } from "lib/lib-discover-hosts";
import { log } from "lib/lib-log";
import { hostInfo } from "./lib-host-info";

const getHashMaxCount = (ns: NS, upgradeName: string) => {
  const existingHashes = Math.floor(ns.hacknet.numHashes());
  if (existingHashes <= 0) {
    return 0;
  }

  const count = Math.floor(
    ns.hacknet.numHashes() / ns.hacknet.hashCost(upgradeName)
  );

  // do batches of 50% of possible calc
  // this because, there's an increment on every upgrade spent that's not taken into account directly
  const bestGuess = Math.floor(count * 0.5);

  //   log(
  //     ns,
  //     `getHashMaxCount existingHashes:${existingHashes} hashCost:${ns.hacknet.hashCost(
  //       upgradeName
  //     )}`
  //   );

  return bestGuess;
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
    .filter((host) => host.mm > 0 && host.ms >= 4)
    .sort((a, b) => b.mm - a.mm);

  hostDetailsList.forEach((hostDetails) => {
    reduceMinSec(ns, hostDetails.host);
  });
};
