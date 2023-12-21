import { NS } from "@ns";
import { humanReadableMoney } from "helper";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.tail();

  const listUsableServers = () => {
    const ownedServers = ns.getPurchasedServers();
    return [...ownedServers, "home"];
  };

  const servers = listUsableServers();

  const generateReport = () => {
    const report: {
      date: Date;
      totalServers: number;
      ram: { available: number; free: number; percentFree: string };
      serversRam: {
        [key: string]: number;
      };
      scripts: {
        [key: string]: {
          totalThreads: number;
          args: {
            [key: string]: number;
          };
        };
      };
    } = {
      date: new Date(),
      totalServers: servers.length,
      ram: { available: 0, free: 0, percentFree: `${0} %` },
      serversRam: {}, // ram: count
      scripts: {}, //script: { totalThreads: count, args: { [name.join(',')]: threadCount }}
    };

    for (const host of servers) {
      const maxRam = ns.getServerMaxRam(host);
      const usedRam = ns.getServerUsedRam(host);

      report.ram.available += maxRam;
      report.ram.free += Math.floor(maxRam - usedRam);

      const percentRamFree = (report.ram.free * 100) / report.ram.available;
      report.ram.percentFree = `${Math.round(percentRamFree)}%`;

      const serverRamKey = maxRam;
      if (!(serverRamKey in report.serversRam)) {
        report.serversRam[serverRamKey] = 1;
      } else {
        report.serversRam[serverRamKey] += 1;
      }

      const hostScripts = ns
        .ps(host)
        .filter((script) => /^hacks\//.test(script.filename));

      for (const runningScript of hostScripts) {
        if (!(runningScript.filename in report.scripts)) {
          report.scripts[runningScript.filename] = {
            totalThreads: runningScript.threads,
            args: {
              [runningScript.args.join(",")]: runningScript.threads,
            },
          };
        } else {
          report.scripts[runningScript.filename].totalThreads +=
            runningScript.threads;
          const argsKey = runningScript.args.join(",");
          if (!(argsKey in report.scripts[runningScript.filename].args)) {
            report.scripts[runningScript.filename].args[argsKey] =
              runningScript.threads;
          } else {
            report.scripts[runningScript.filename].args[argsKey] +=
              runningScript.threads;
          }
        }
      }
    }

    return report;
  };

  const WAIT_TIME = 500; // 500 ms
  while (true) {
    const data = generateReport();
    const report = {
      ...data,
      ram: {
        ...data.ram,
        available: humanReadableMoney(data.ram.available),
        free: humanReadableMoney(data.ram.free),
      },
    };

    ns.clearLog();
    ns.print(JSON.stringify(report, null, 2));
    await ns.sleep(WAIT_TIME);
  }
}
