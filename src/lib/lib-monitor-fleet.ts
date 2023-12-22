import { NS } from "@ns";
import { SCRIPT_GROW, SCRIPT_HACK, SCRIPT_WEAKEN } from "/constants";

export const generateScriptDetails = (ns: NS, hosts: string[]) => {
  const monitoredScripts: {
    [key: string]: number;
  } = {
    hack: 0,
    grow: 0,
    weaken: 0,
  };

  const scriptKeyMap: { [key: string]: string } = {
    [SCRIPT_HACK]: "hack",
    [SCRIPT_GROW]: "grow",
    [SCRIPT_WEAKEN]: "weaken",
  };

  for (const host of hosts) {
    const hostScripts = ns
      .ps(host)
      .filter((script) => /^hacks\//.test(script.filename));

    for (const runningScript of hostScripts) {
      const key = scriptKeyMap[runningScript.filename];

      if (key in monitoredScripts) {
        monitoredScripts[key] += runningScript.threads;
      } else {
        monitoredScripts[key] = runningScript.threads;
      }
    }
  }

  return monitoredScripts;
};

export const generateRamDetails = (ns: NS, hosts: string[]) => {
  let totalRam = 0;
  let totalAvailable = 0;

  const serverRamMap: { [key: string]: number } = {};
  for (const host of hosts) {
    const maxRam = ns.getServerMaxRam(host);
    const usedRam = ns.getServerUsedRam(host);

    totalRam += maxRam;
    totalAvailable += Math.floor(maxRam - usedRam);

    const ramKey = maxRam.toString();
    if (ramKey in serverRamMap) {
      serverRamMap[ramKey] += 1;
    } else {
      serverRamMap[ramKey] = 1;
    }
  }

  const percentRamFree = (totalAvailable * 100) / totalRam;
  const ramMbToGb = (ram: number) => {
    if (ram < 1024) {
      return `${ram.toFixed(2)} Mb`;
    } else {
      return `${(ram / 1024).toFixed(2)} Gb`;
    }
  };

  return {
    totalRam: ramMbToGb(totalRam),
    totalAvailable: ramMbToGb(totalAvailable),
    percentFree: `${percentRamFree.toFixed(2)} %`,
    serverRampMap: serverRamMap,
  };
};

export const generateReport = (ns: NS) => {
  const hosts = [...ns.getPurchasedServers(), "home"];
  const ramDetails = generateRamDetails(ns, hosts);
  const threads = generateScriptDetails(ns, hosts);

  return {
    hosts: hosts.length,
    ramDetails,
    threads,
  };
};
