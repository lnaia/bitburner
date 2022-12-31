import {REMOTE_SERVER_PREFIX, HACK_SCRIPT} from './constants';
import type {NS} from './NetscriptDefinitions';

type StatusReport = [boolean, string?];

export const openPorts = (ns: NS, host: string): StatusReport => {
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

const availableFunds = ns => ns.getServerMoneyAvailable('home');

export const buyNode = ({ns}) => {
  const cost = ns.hacknet.getPurchaseNodeCost();
  if (availableFunds(ns) >= cost) {
    ns.hacknet.purchaseNode();
    return [true, 'buyNode: success'];
  }

  return [false, 'buyNode: failed, not enough funds'];
};

export const upgradeNode = ({ns, nodeIndex}) => {
  const upgradeType = [];

  const upgradeRam = () => {
    const costs = ns.hacknet.getRamUpgradeCost(nodeIndex, 1);
    if (availableFunds(ns) >= costs) {
      ns.hacknet.upgradeRam(nodeIndex, 1);
      upgradeType.push('ram');
    }
  };

  const upgradeLevel = () => {
    const costs = ns.hacknet.getLevelUpgradeCost(nodeIndex, 1);
    if (availableFunds(ns) >= costs) {
      ns.hacknet.upgradeLevel(nodeIndex, 1);
      upgradeType.push('level');
    }
  };

  const upgradeCore = () => {
    const costs = ns.hacknet.getCoreUpgradeCost(nodeIndex, 1);
    if (availableFunds(ns) >= costs) {
      ns.hacknet.upgradeCore(nodeIndex, 1);
      upgradeType.push('core');
    }
  };

  upgradeRam();
  upgradeLevel();
  upgradeCore();

  return [upgradeType.length > 0, upgradeType.join(', ')];
};

export const upgradeNodes = ({ns}) => {
  const nodes = ns.hacknet.numNodes();
  for (let i = 0; i < nodes; i += 1) {
    const status = upgradeNode({ns, nodeIndex: i});
    if (status[0]) {
      ns.print(`upgradeNodes: ${i}-${status[0]} ${status[1]}`);
    }
  }
};

export const getRoot = ({host, ns}) => {
  if (!openPorts({host, ns})) {
    return [false, `getRootAccess@${host}: unable to open ports`];
  }

  if (!ns.hasRootAccess(host)) {
    try {
      ns.nuke(host);
    } catch (e) {
      return [false, `getRootAccess@${host}: unable to nuke: `, e.message];
    }
  }

  return [ns.hasRootAccess(host)];
};

const genStr = (max, char = ' ', curr = 0) => {
  if (curr === max) {
    return char;
  }

  return char + genStr(max, char, curr + 1);
};

const longestStr = list =>
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

const rightPad = (str, len) => {
  if (str.length > len) {
    const arr = str.split('');
    arr.splice(0, len);
    return arr;
  } else if (str.length === len) {
    return str;
  }

  const whiteSpaceCount = len - str.length;

  return `${str}${genStr(whiteSpaceCount)}`;
};

export const printObjList = (list, print) => {
  const forceString = val => {
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
  const longestValue = list.reduce((acc, obj) => {
    const longestVals = Object.values(obj)
      .map(forceString)
      .sort((a, b) => b.length - a.length);
    if (longestVals[0].length > acc[1]) {
      return [longestVals[0], longestVals[0].length];
    } else {
      return acc;
    }
  }, longestHeader);

  const longestColumn =
    longestHeader[1] > longestValue[1] ? longestHeader : longestValue;

  const headerRow = [];
  headers.forEach(header => {
    headerRow.push(rightPad(header, longestColumn[1] + 1));
  });

  const rows = [];
  list.forEach(obj => {
    const objVals = Object.values(obj).map(val =>
      rightPad(forceString(val), longestColumn[1] + 1)
    );
    rows.push(objVals.join(''));
  });

  print(headerRow.join(''));
  rows.forEach(row => print(row));
};

export const hostInfo = ({host, ns}) => {
  const moneyMax = ns.getServerMaxMoney(host);
  const moneyCurrent = ns.getServerMoneyAvailable(host);
  const percentDiff = Math.round(100 - (moneyCurrent * 100) / moneyMax);

  return {
    host,
    'max money': moneyMax,
    'cur money': Math.round(moneyCurrent),
    '% diff': percentDiff,
    'req hack': Math.round(ns.getServerRequiredHackingLevel(host)),
    'min sec': Math.round(ns.getServerMinSecurityLevel(host)),
    'cur sec': Math.round(ns.getServerSecurityLevel(host)),
    'ports req': ns.getServerNumPortsRequired(host),
    'total files': ns.ls(host)?.length,
    // 'files': ns.ls(host)?.join(', ')
  };
};

const shouldExcludeHost = host => {
  const regex = new RegExp(`${REMOTE_SERVER_PREFIX}|home|darkweb`);
  return !regex.test(host);
};

export const discoverHosts = ({ns, onlyHackable = true}) => {
  const playerHackingLevel = ns.getHackingLevel();
  const connectedHosts = host => ns.scan(host).filter(shouldExcludeHost);
  const visitedHosts = [];
  const visitHost = ({baseHost}) => {
    if (visitedHosts.includes(baseHost)) {
      return;
    } else if (shouldExcludeHost(baseHost)) {
      visitedHosts.push(baseHost);
    }

    connectedHosts(baseHost).forEach(host => visitHost({baseHost: host}));
  };

  visitHost({baseHost: 'home'});

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

export const autoRootHosts = ({ns}) => {
  discoverHosts({ns}).forEach(host => {
    const status = getRoot({ns, host});
    if (!status[0]) {
      ns.print(`autoRootHosts@${host}: ${status}`);
    }
  });
};

export const calculateThreads = ({ns, script, scriptMemory, host}) => {
  const maxRam = ns.getServerMaxRam(host);
  const usedRam = ns.getServerUsedRam(host);
  const availableRam = maxRam - usedRam;
  return Math.floor(availableRam / scriptMemory);
};

export const execScript = ({host, ns, script, scriptArgs}) => {
  const scriptMemory = ns.getScriptRam(script);
  const numTreads = calculateThreads({ns, script, scriptMemory, host});
  const availableMemory = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
  if (scriptMemory > availableMemory) {
    return [
      false,
      `provisionScript: failed, insuficient ram@${host}, need: ${scriptMemory} got ${availableMemory}`,
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

const HOST_SCRIPT = {
  // host: ticks-passed
};

const provision = ({ns, host, script, scriptArgs, forceUpload = false}) => {
  const upload = () => {
    // delete file if it exists on remote server
    if (ns.fileExists(script, host)) {
      ns.rm(script, host);
    }
    // upload script
    ns.scp(script, host);
  };

  const startScript = () => {
    return execScript({
      ns,
      host,
      script,
      scriptArgs,
    });
  };

  const respawn = () => {
    ns.kill(foundScript.pid, host);
    return startScript();
  };

  if (forceUpload) {
    upload();
  }

  const scriptRamCost = ns.getScriptRam(script);
  const serverMaxRam = ns.getServerMaxRam(host);
  const potentialThreads = Math.floor(serverMaxRam / scriptRamCost);
  const foundScript = ns
    .ps(host)
    .find(foundScript => foundScript.filename === script);
  /**
   * 3600 1h
   * 1800 30m
   * 900  15m
   * 450  7m 30s
   */
  const MIN_TICKS_REQUIRED = 3600; // 1 tick = 1 second;  900s === 15m

  if (!(host in HOST_SCRIPT)) {
    HOST_SCRIPT[host] = 0;
  } else {
    HOST_SCRIPT[host] += 1;
  }

  if (foundScript) {
    // should respawn with more threads?
    if (foundScript.threads < potentialThreads) {
      respawn();
    }

    // should respawn because args changed?
    if (foundScript.args[0] !== scriptArgs[0]) {
      if (HOST_SCRIPT[host] > MIN_TICKS_REQUIRED) {
        HOST_SCRIPT[host] = 0;
        respawn();
      }
    }
  } else {
    upload();
    return startScript();
  }
};

export const autoProvisionHosts = ({ns}) => {
  const ownedServers = ns.getPurchasedServers();
  const hackedServers = discoverHosts({ns}).filter(
    host => ns.hasRootAccess(host) && ns.getServerMaxRam(host) > 0
  );
  const hosts = [...ownedServers, ...hackedServers];

  for (let host of hosts) {
    const profitableHost = 'zeus-med'; // findProfitableHost({ ns });
    const status = provision({
      script: HACK_SCRIPT,
      host,
      ns,
      scriptArgs: [profitableHost],
    });

    if (status) {
      ns.print(status);
    }
  }
};
export const humanReadableMoney = ({ns, money}: {ns: NS; money: number}) => {
  const str: string[] = [];
  const charList = money.toString().split('').reverse();

  let groupCounter = 0;
  const GROUPS_OF = 3;
  charList.forEach(c => {
    // ns.tprint({c, groupCounter, str })
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

export const buyServer = ({ns}: {ns: NS}) => {
  const ownServers = ns.getPurchasedServers();
  if (ownServers.length >= ns.getPurchasedServerLimit()) {
    return [false, 'buyServer: failed, purchase limit reached'];
  }

  const purchaseServerRam = 8;
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

export const upgradeServer = ({ns, host}: {ns: NS; host: string}) => {
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

export const upgradeServers = ({ns}: {ns: NS}) => {
  for (let host of ns.getPurchasedServers()) {
    const status = upgradeServer({ns, host});
    if (status[0]) {
      ns.print(status);
    }
  }
};

const hackValuePerHour = ({curMoney, hackTime, hackAmount}) => {
  const millisecondsInAnHour = 60 * 60 * 1000;
  try {
    const amountPerHack = hackAmount * curMoney;
    return (millisecondsInAnHour / hackTime) * amountPerHack;
  } catch (e) {
    ns.print('error calculating hackValuePerHour: ', e.message);
    return 0;
  }
};

const findRootedHostsWithMoney = ({ns}) => {
  return discoverHosts({ns})
    .filter(host => ns.hasRootAccess(host) && ns.getServerMaxMoney(host) > 1)
    .map(host => {
      const maxMoney = ns.getServerMaxMoney(host);
      const hostMoney = ns.getServerMoneyAvailable(host);
      const curMoney = hostMoney > 0 ? hostMoney : 1;
      const percentMissingToMax = (100 - (curMoney * 100) / maxMoney).toFixed(
        4
      );
      const hackTime = ns.getHackTime(host);
      const hackAmount = ns.hackAnalyze(host).toFixed(4);
      const growthAmount = (() => {
        const val = Math.ceil(maxMoney / curMoney);
        return val > 0 ? val : 1;
      })();
      const growTimes = Math.ceil(ns.growthAnalyze(host, growthAmount));
      const moneyPerHour = Math.round(
        hackValuePerHour({
          curMoney,
          hackTime,
          hackAmount,
        })
      );
      const theoreticalMoneyPerHour = Math.round(
        hackValuePerHour({
          curMoney: maxMoney,
          hackTime,
          hackAmount,
        })
      );
      return {
        host,
        mm: maxMoney,
        cm: Math.round(curMoney),
        '% missing': percentMissingToMax,
        h: ns.getServerRequiredHackingLevel(host),
        sec: Math.round(ns.getServerSecurityLevel(host)),
        msec: Math.round(ns.getServerMinSecurityLevel(host)),
        gt: growTimes,
        ht: Math.round(hackTime),
        // MPH: moneyPerHour,
        // tMPH: theoreticalMoneyPerHour
      };
    });
};

export const findPotentialMaxProfitHosts = ({
  ns,
  currentMoney = true,
  maxMoney = false,
}) => {
  const hosts = findRootedHostsWithMoney({ns}).sort((a, b) => {
    if (currentMoney) {
      return b.cm - a.cm;
    }

    if (maxMoney) {
      return b.mm - a.mm;
    }

    return b.tMPH - a.tMPH;
  });

  return hosts;
};

export const findPotentialMaxProfitHost = ({
  ns,
  currentMoney = true,
  maxMoney = false,
}) => {
  const hosts = findPotentialMaxProfitHosts({ns, maxMoney, currentMoney});
  return hosts[0].host;
};

// most profitable per hour
export const findProfitableHosts = ({ns}) => {
  // top 5 lowest security level
  // of these: sort by most money available
  const hosts = findRootedHostsWithMoney({ns}).sort((a, b) => {
    // lowest hack time
    // return a.ht - b.ht

    // highest max money
    return b.mm - a.mm;

    // lowest hacking level
    return a.h - b.h;
  });

  // if (ns.getHackingLevel() > 200) {
  //     return hosts.filter((host) => {
  //         return host.msec >= 10 && host.cm > 10
  //     })
  // }

  return hosts;
};

export const findProfitableHost = ({ns}) => findProfitableHosts({ns})[0].host;

const shouldExcludeHost = host => {
  const regex = new RegExp(`${REMOTE_SERVER_PREFIX}|home|darkweb`);
  return !regex.test(host);
};

export const discoverHosts = ({ns, onlyHackable = true}) => {
  const playerHackingLevel = ns.getHackingLevel();
  const connectedHosts = host => ns.scan(host).filter(shouldExcludeHost);
  const visitedHosts = [];
  const visitHost = ({baseHost}) => {
    if (visitedHosts.includes(baseHost)) {
      return;
    } else if (shouldExcludeHost(baseHost)) {
      visitedHosts.push(baseHost);
    }

    connectedHosts(baseHost).forEach(host => visitHost({baseHost: host}));
  };

  visitHost({baseHost: 'home'});

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

export const autoRootHosts = ({ns}) => {
  discoverHosts({ns}).forEach(host => {
    const status = getRoot({ns, host});
    if (!status[0]) {
      ns.print(`autoRootHosts@${host}: ${status}`);
    }
  });
};
