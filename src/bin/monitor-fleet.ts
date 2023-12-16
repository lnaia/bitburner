import { NS } from "@ns";
import { discoverHosts } from "/lib/lib-discover-hosts";
import { humanReadableMoney } from "helper";

export async function main(ns: NS) {
  ns.disableLog("ALL");
  ns.tail();

  const listUsableServers = () => {
    const ownedServers = ns.getPurchasedServers();
    const rootedServers = discoverHosts(ns, false).filter(
      (host) => ns.hasRootAccess(host) && ns.getServerMaxRam(host) > 0
    );
    return [...ownedServers, ...rootedServers];
  };

  const servers = listUsableServers();
  const generateReport = () => {
    const report: {
      date: Date;
      totalServers: number;
      totalMoneyAvailable: number;
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
      totalServers: 0,
      totalMoneyAvailable: 0,
      ram: { available: 0, free: 0, percentFree: `${0} %` },
      serversRam: {}, // ram: count
      scripts: {}, //script: { totalThreads: count, args: { [name.join(',')]: threadCount }}
    };

    for (const host of servers) {
      const maxRam = ns.getServerMaxRam(host);
      const usedRam = ns.getServerUsedRam(host);

      report.totalServers += 1;
      report.totalMoneyAvailable += ns.getServerMoneyAvailable(host);

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

      for (const runningScript of ns.ps(host)) {
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

    return {
      ...report,
      totalMoneyAvailable: humanReadableMoney(
        Math.round(report.totalMoneyAvailable)
      ),
    };
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

    // keep last snapshot in file
    const jsonData = `${JSON.stringify(report)}\n`;
    ns.write("monitor-fleet-report-log.txt", jsonData, "w");

    ns.clearLog();
    ns.print(JSON.stringify(report, null, 2));

    await ns.sleep(WAIT_TIME);
  }
}
