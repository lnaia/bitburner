import { discoverHosts } from "lib/lib-discover-hosts";
import { hostInfo } from "lib/lib-host-info";
import { printObjList } from "helper";
import { log } from "lib/lib-log";
import { NS } from "@ns";

export const monitorHost = async (ns: NS, host: string) => {
  const maxRows = 30;
  const print = ns.print.bind(ns);
  const dataPoints: { hcm: string; diff: string; cs: string; hc: number }[] =
    [];

  while (true) {
    const { hcm, diff, cs, hc, hmm, rh, ms } = hostInfo(ns, host);

    if (dataPoints.length > 0) {
      const lastElement = dataPoints[dataPoints.length - 1];
      const { hcm: LE_hcm, diff: LE_diff, cs: LE_cs, hc: LE_hc } = lastElement;
      if (LE_cs !== cs || LE_diff !== diff || LE_hc !== hc) {
        dataPoints.push({ hcm, diff, cs, hc });
      }
    } else {
      dataPoints.push({ hcm, diff, cs, hc });
    }

    ns.clearLog();
    log(ns, JSON.stringify({ hmm, rh, ms }));
    // @ts-expect-error
    printObjList(dataPoints, print);

    if (dataPoints.length > maxRows) {
      dataPoints.splice(0, 1);
    }

    await ns.sleep(1000);
  }
};

type Props = {
  ns: NS;
  maxHosts?: number;
  sortOrder?: string;
  invert?: boolean;
  name?: string;
};
export const monitorHosts = ({
  ns,
  maxHosts,
  sortOrder,
  invert,
  name,
}: Props) => {
  let hosts = discoverHosts(ns)
    .filter((host) => ns.hasRootAccess(host))
    .map((host) => hostInfo(ns, host))
    .filter((host) => host.mm > 0);

  // @ts-expect-error
  if (maxHosts > 0) {
    hosts = hosts.slice(0, maxHosts);
  }

  if (invert) {
    hosts = hosts.reverse();
  }

  if (typeof name === "string" && name.length) {
    hosts = hosts.filter((host) => new RegExp(name).test(host.host));
  }

  const list = hosts
    .sort((a, b) => {
      if (sortOrder === "cm") {
        return b.cm - a.cm;
      } else if (sortOrder === "rh") {
        return b.rh - a.rh;
      } else if (sortOrder === "ms") {
        return b.ms - a.ms;
      }

      return b.mm - a.mm;
    })
    .map((hostDetails, index) => {
      const { host, hmm, hcm, diff, rh, ms, cs, hc, batchJob } = hostDetails;
      return {
        host: `${index}@${host}`,
        hmm,
        hcm,
        diff,
        ms,
        cs,
        rh,
        hc,
        batchJob,
      };
    });

  const maxSize = 10;
  const shortList = list.slice(0, maxSize);

  ns.clearLog();
  log(ns, `monitor-hosts, ${maxSize} shown out of ${list.length}`);
  const print = ns.print.bind(ns);
  // @ts-expect-error
  printObjList(shortList, print);
};
