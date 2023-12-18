import { NS } from "@ns";

export const stopConditionWeaken = (ns: NS, host: string) => {
  const minSecurity = ns.getServerMinSecurityLevel(host);
  const currSecurity = ns.getServerSecurityLevel(host);

  return currSecurity <= minSecurity + 0.1;
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
