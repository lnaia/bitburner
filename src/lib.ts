import {REMOTE_SERVER_PREFIX, HACK_SCRIPT} from './constants';
import type {NS} from './NetscriptDefinitions';

type StatusReport = [boolean, string?];

export const humanReadableMoney = (money: number) => {
  const str: string[] = [];
  const charList = Math.round(money).toString().split('').reverse();

  let groupCounter = 0;
  const GROUPS_OF = 3;
  charList.forEach(c => {
    if (groupCounter < GROUPS_OF) {
      str.push(c);
      groupCounter += 1;
    } else if (groupCounter === GROUPS_OF) {
      str.push('_');
      str.push(c);
      groupCounter = 1;
    }
  });

  return str.reverse().join('');
};

export const buyServer = (ns: NS): StatusReport => {
  const ownServers = ns.getPurchasedServers();
  if (ownServers.length >= ns.getPurchasedServerLimit()) {
    return [false, 'buyServer: failed, purchase limit reached'];
  }

  const purchaseServerRam = 2;
  const cost = ns.getPurchasedServerCost(purchaseServerRam);
  if (ns.getServerMoneyAvailable('home') > cost) {
    const serverId = ownServers.length + 1;
    const newHostname = `${REMOTE_SERVER_PREFIX}-${serverId}`;
    const confirmedHostname = ns.purchaseServer(newHostname, purchaseServerRam);

    if (confirmedHostname) {
      [true, `buyServer: success, ${confirmedHostname}@${purchaseServerRam}`];
    } else {
      [false, 'buyServer: failed'];
    }
  }

  return [false, 'buyServer: failed, not enough funds'];
};

const upgradeServer = (ns: NS, host: string): StatusReport => {
  const currentRam = ns.getServerMaxRam(host);
  const newRamValue = currentRam * 2;
  const upgradeCost = Math.round(
    ns.getPurchasedServerUpgradeCost(host, newRamValue)
  );

  if (ns.getServerMoneyAvailable('home') >= upgradeCost) {
    ns.upgradePurchasedServer(host, newRamValue);
    return [true, `upgradeServer: success, ${host} upgraded to ${newRamValue}`];
  }

  return [false, `upgradeServer: failed, ${host} not enough funds`];
};

export const upgradeServers = (ns: NS): StatusReport[] => {
  return ns.getPurchasedServers().map(host => upgradeServer(ns, host));
};

export const buyNode = (ns: NS): StatusReport => {
  const cost = ns.hacknet.getPurchaseNodeCost();
  const availableFunds = ns.getServerMoneyAvailable('home');
  if (availableFunds >= cost) {
    ns.hacknet.purchaseNode();
    return [true, 'buyNode: success'];
  }

  return [false, 'buyNode: failed, not enough funds'];
};

const upgradeNode = (ns: NS, nodeIndex: number): StatusReport => {
  const upgradeType: string[] = [];
  const availableFunds = () => ns.getServerMoneyAvailable('home');
  const upgradeRam = () => {
    const costs = ns.hacknet.getRamUpgradeCost(nodeIndex, 1);
    if (availableFunds() >= costs) {
      ns.hacknet.upgradeRam(nodeIndex, 1);
      upgradeType.push('ram');
    }
  };

  const upgradeLevel = () => {
    const costs = ns.hacknet.getLevelUpgradeCost(nodeIndex, 1);
    if (availableFunds() >= costs) {
      ns.hacknet.upgradeLevel(nodeIndex, 1);
      upgradeType.push('level');
    }
  };

  const upgradeCore = () => {
    const costs = ns.hacknet.getCoreUpgradeCost(nodeIndex, 1);
    if (availableFunds() >= costs) {
      ns.hacknet.upgradeCore(nodeIndex, 1);
      upgradeType.push('core');
    }
  };

  upgradeRam();
  upgradeLevel();
  upgradeCore();

  return [upgradeType.length > 0, `${nodeIndex}:${upgradeType.join(', ')}`];
};

export const upgradeNodes = (ns: NS): StatusReport[] => {
  const statusReports: StatusReport[] = [];
  const nodes = ns.hacknet.numNodes();
  for (let i = 0; i < nodes; i += 1) {
    statusReports.push(upgradeNode(ns, i));
  }

  return statusReports;
};

const openPorts = (ns: NS, host: string): StatusReport => {
  const portEnforcers = {
    'BruteSSH.exe': (h: string) => ns.brutessh(h),
    'FTPCrack.exe': (h: string) => ns.ftpcrack(h),
    'relaySMTP.exe': (h: string) => ns.relaysmtp(h),
    'HTTPWorm.exe': (h: string) => ns.httpworm(h),
    'SQLInject.exe': (h: string) => ns.sqlinject(h),
  };

  const countPortEnforcers = () => {
    return Object.keys(portEnforcers).reduce((total, portEnforcer) => {
      if ((ns.fileExists(portEnforcer), 'home')) {
        return total + 1;
      }
      return total;
    }, 0);
  };

  const existingPortEnforcers = countPortEnforcers();
  const portsRequired = ns.getServerNumPortsRequired(host);
  if (portsRequired > existingPortEnforcers) {
    return [
      false,
      `openPorts: failed, ports required ${portsRequired} > ${existingPortEnforcers}`,
    ];
  }

  let portsOpen = 0;
  if (portsOpen === portsRequired) {
    return [true];
  }

  for (let [app, cmd] of Object.entries(portEnforcers)) {
    if (ns.fileExists(app, 'home')) {
      cmd(host);
      portsOpen += 1;
    }

    // open only what you need - no more
    if (portsOpen === portsRequired) {
      break;
    }
  }

  return [true];
};

export const getRoot = (ns: NS, host: string): StatusReport => {
  if (!openPorts(ns, host)) {
    return [false, `getRootAccess@${host}: unable to open ports`];
  }

  const isHackable =
    ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(host);

  if (!ns.hasRootAccess(host) && isHackable) {
    try {
      ns.nuke(host);
    } catch (e) {
      return [false, `getRootAccess@${host}: unable to nuke ${e.message}`];
    }
  }

  return [ns.hasRootAccess(host), `getRootAccess@${host} success`];
};

export const printObjList = (
  list: unknown[],
  print: (...args: string[]) => void
) => {
  const genStr = (max: number, char = ' ', curr = 0): string => {
    if (curr === max) {
      return char;
    }

    return char + genStr(max, char, curr + 1);
  };

  const longestStr = (list: string[]): [string, number] =>
    list.reduce(
      (acc, str) => {
        if (str.length > acc[1]) {
          return [str, str.length];
        } else {
          return acc;
        }
      },
      ['', 0]
    );

  const rightPad = (str: string, len: number): string => {
    if (str.length > len) {
      const arr = str.split('');
      arr.splice(0, len);
      return arr.join('');
    } else if (str.length === len) {
      return str;
    }

    const whiteSpaceCount = len - str.length;

    return `${str}${genStr(whiteSpaceCount)}`;
  };

  const forceString = (val: string | number) => {
    if (typeof val !== 'string') {
      try {
        return val.toString();
      } catch (e) {
        print('toString failed on type:', typeof val, ' with ', e);
        return `${val}`;
      }
    }
    return val;
  };

  const headers = Object.keys(list[0]);
  const longestHeader = longestStr(headers);
  const findLongestValue = (
    acc: [string, number],
    obj: {[key: string]: string}
  ): [string, number] => {
    const longestVals = Object.values(obj)
      .map(forceString)
      .sort((a, b) => b.length - a.length);
    if (longestVals[0].length > acc[1]) {
      return [longestVals[0], longestVals[0].length];
    } else {
      return acc;
    }
  };
  const longestValue = list.reduce<[string, number]>(
    findLongestValue,
    longestHeader
  );

  const longestColumn =
    longestHeader[1] > longestValue[1] ? longestHeader : longestValue;

  const headerRow: string[] = [];
  headers.forEach(header => {
    headerRow.push(rightPad(header, longestColumn[1] + 1));
  });

  const rows: string[] = [];
  list.forEach(obj => {
    const objVals = Object.values(obj).map(val =>
      rightPad(forceString(val), longestColumn[1] + 1)
    );
    rows.push(objVals.join(''));
  });

  print(headerRow.join(''));
  rows.forEach(row => print(row));
};

const shouldExcludeHost = (host: string) => {
  const regex = new RegExp(`${REMOTE_SERVER_PREFIX}|home|darkweb`);
  return !regex.test(host);
};

interface HostDetails {
  mm: number;
  hmm: string;
  cm: number;
  hcm: string;
  host: string;
  '% diff': string;
  rh: number;
  ms: number;
  cs: number;
  ht: number;
}

export const hostInfo = (ns: NS, host: string): HostDetails => {
  const moneyMax = ns.getServerMaxMoney(host);
  const moneyCurrent = ns.getServerMoneyAvailable(host);
  const percentDiff = (100 - (moneyCurrent * 100) / moneyMax).toFixed(4);

  return {
    host,
    mm: moneyMax,
    hmm: humanReadableMoney(moneyMax),
    cm: moneyCurrent,
    hcm: humanReadableMoney(moneyCurrent),
    '% diff': percentDiff,
    rh: Math.round(ns.getServerRequiredHackingLevel(host)),
    ms: Math.round(ns.getServerMinSecurityLevel(host)),
    cs: Math.round(ns.getServerSecurityLevel(host)),
    ht: Math.round(ns.getHackTime(host)),
  };
};

export const listHackableHosts = (ns: NS): HostDetails[] => {
  return discoverHosts(ns)
    .filter(host => ns.hasRootAccess(host) && ns.getServerMaxMoney(host) > 1)
    .map(host => hostInfo(ns, host))
    .sort((a, b) => b.mm - a.mm);
};

const provision = (
  ns: NS,
  host: string,
  script: string,
  scriptArgs: string[]
): StatusReport => {
  const upload = () => {
    // delete file if it exists on remote server
    if (ns.fileExists(script, host)) {
      ns.rm(script, host);
    }
    // upload script
    ns.scp(script, host);
  };

  const startScript = () => {
    return execScript(ns, host, script, scriptArgs);
  };

  const respawn = (pid: number) => {
    ns.kill(pid);
    return startScript();
  };

  const scriptRamCost = ns.getScriptRam(script);
  const serverMaxRam = ns.getServerMaxRam(host);
  const potentialThreads = Math.floor(serverMaxRam / scriptRamCost);
  const foundScript = ns
    .ps(host)
    .find(foundScript => foundScript.filename === script);

  if (foundScript) {
    // should respawn with more threads?
    if (foundScript.threads < potentialThreads) {
      return respawn(foundScript.pid);
    }
    // should respawn because args changed?
    if (foundScript.args[0] !== scriptArgs[0]) {
      return respawn(foundScript.pid);
    }

    return [false, `${host}: running script as expected`];
  } else {
    upload();
    return startScript();
  }
};

export const calculateThreads = (
  ns: NS,
  scriptMemory: number,
  host: string
) => {
  const maxRam = ns.getServerMaxRam(host);
  const usedRam = ns.getServerUsedRam(host);
  const availableRam = maxRam - usedRam;
  return Math.floor(availableRam / scriptMemory);
};

export const execScript = (
  ns: NS,
  host: string,
  script: string,
  scriptArgs: string[]
): StatusReport => {
  const scriptMemory = ns.getScriptRam(script);
  const numTreads = calculateThreads(ns, scriptMemory, host);
  const availableMemory = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
  if (scriptMemory > availableMemory) {
    return [
      false,
      `provisionScript: failed, insufficient ram@${host}, need: ${scriptMemory} got ${availableMemory}`,
    ];
  }

  // exec
  const pid = ns.exec(script, host, numTreads, ...scriptArgs);
  if (pid) {
    return [
      true,
      `provisionScript: success, ${script} running on ${host} w/ ${numTreads} threads.`,
    ];
  } else {
    return [false, `provisionScript: failed, exec ${script} on ${host}`];
  }
};
export const discoverHosts = (ns: NS, onlyHackable = true): string[] => {
  const playerHackingLevel = ns.getHackingLevel();
  const connectedHosts = (host: string) =>
    ns.scan(host).filter(shouldExcludeHost);
  const visitedHosts: string[] = [];
  const visitHost = (baseHost: string) => {
    if (visitedHosts.includes(baseHost)) {
      return;
    } else if (shouldExcludeHost(baseHost)) {
      visitedHosts.push(baseHost);
    }

    connectedHosts(baseHost).forEach(host => visitHost(host));
  };

  visitHost('home');

  if (!onlyHackable) {
    return visitedHosts;
  }
  // only return hosts that are hackable
  return visitedHosts.filter(host => {
    try {
      return playerHackingLevel >= ns.getServerRequiredHackingLevel(host);
    } catch (e) {
      ns.print('unable to get host req hacking level: ', e.message);
      return false;
    }
  });
};

export const autoRootHosts = (ns: NS): StatusReport[] => {
  return discoverHosts(ns).map(host => getRoot(ns, host));
};

export const autoProvisionHosts = (ns: NS) => {
  const ownedServers = ns.getPurchasedServers();
  const hackedServers = discoverHosts(ns).filter(
    host => ns.hasRootAccess(host) && ns.getServerMaxRam(host) > 0
  );

  // hosts sorted by ram desc
  const hosts = ['home', ...ownedServers, , ...hackedServers]
    .map(host => ({
      host,
      ram: ns.getServerMaxRam(host),
    }))
    .sort((a, b) => b.ram - a.ram)
    .map(item => item.host);

  const statusReports: StatusReport[] = [];
  const hackableHosts = listHackableHosts(ns);

  for (let i = 0, targetIndex = 0; i <= hosts.length; i += 1) {
    const host = hosts[i];

    // evolution of this would be to spread among available threads...
    // 1 server for each host, with exceptions:
    // fallbacks is the most profitable host first
    const profitableHost = (() => {
      if (/remote-server|home/.test(host)) {
        if (i < hackableHosts.length) {
          targetIndex = i;
        } else {
          targetIndex = 0;
        }

        return hackableHosts[targetIndex].host;
      }

      return hackableHosts[0].host;
    })();

    const status = provision(ns, host, HACK_SCRIPT, [profitableHost]);
    statusReports.push(status);
  }

  return statusReports;
};
