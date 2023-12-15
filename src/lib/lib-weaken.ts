import { NS } from "@ns";

export const stopConditionWeaken = (ns: NS, host: string) => {
  ns.disableLog("ALL");
  const minSecurity = ns.getServerMinSecurityLevel(host);
  const currSecurity = ns.getServerSecurityLevel(host);

  return currSecurity <= minSecurity;
};

/** Calculates threads required to weaken a host to the min security possible
 * @param securityIncrease - override current security, useful when trying to calculate future security levels
 * @returns number of threads
 * */
export const calcWeakenThreads = (
  ns: NS,
  host: string,
  securityIncrease?: number
) => {
  ns.disableLog("ALL");
  const minSecurity = ns.getServerMinSecurityLevel(host);
  const currSec = securityIncrease
    ? minSecurity + securityIncrease
    : ns.getServerSecurityLevel(host);
  const weakenAmountPerThread = ns.weakenAnalyze(1);
  const securityToBeReduced = currSec - minSecurity;

  let requiredWeakenThreads = 0;
  if (securityToBeReduced > 0) {
    requiredWeakenThreads = Math.ceil(
      securityToBeReduced / weakenAmountPerThread
    );
  }

  return requiredWeakenThreads;
};
