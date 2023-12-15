import { NS } from "@ns";

export const calculateThreads = (
  ns: NS,
  scriptMemory: number,
  host: string,
  reserveRam?: number
) => {
  const maxRam = ns.getServerMaxRam(host);
  const usedRam = ns.getServerUsedRam(host);
  let availableRam = maxRam - usedRam;
  if (reserveRam) {
    availableRam -= reserveRam;
  }

  try {
    return Math.floor(availableRam / scriptMemory);
  } catch (e) {
    return 0;
  }
};
