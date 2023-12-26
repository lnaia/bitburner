import { NS } from "@ns";
import {
  REMOTE_SERVER_PREFIX,
  HOME_SERVER,
  DARKWEB_SERVER,
  HACKNET_NODE_PREFIX,
} from "constants";

// some bitnodes allow you to run scripts on your hacknet nodes instead of servers
export const getHacknetNodeHostsnames = (ns: NS) => {
  // @todo verify on non upgraded hacknet servers, how to make sure we only return hosts *if* this is possible
  const nodes = ns.hacknet.numNodes();
  const nodeHostnames: string[] = [];

  for (let i = 0; i < nodes; i += 1) {
    nodeHostnames.push(`${HACKNET_NODE_PREFIX}-${i}`);
  }

  return nodeHostnames;
};

export const isAllowedHost = (host: string) => {
  const regex = new RegExp(
    `${REMOTE_SERVER_PREFIX}|${HOME_SERVER}|${DARKWEB_SERVER}`
  );
  return !regex.test(host);
};

export const discoverHosts = (ns: NS, onlyHackable = true): string[] => {
  const connectedHosts = (host: string) => ns.scan(host).filter(isAllowedHost);

  const visitedHosts: string[] = [];
  const visitHost = (baseHost: string) => {
    if (visitedHosts.includes(baseHost)) {
      return;
    } else if (isAllowedHost(baseHost)) {
      visitedHosts.push(baseHost);
    }

    connectedHosts(baseHost).forEach((host) => visitHost(host));
  };

  visitHost(HOME_SERVER);

  if (!onlyHackable) {
    return visitedHosts;
  }

  const playerHackingLevel = ns.getHackingLevel();

  // only return hosts that are hackable
  return visitedHosts.filter((host) => {
    try {
      return playerHackingLevel >= ns.getServerRequiredHackingLevel(host);
    } catch (e: any) {
      ns.print("unable to get host req hacking level: ", e.message);
      return false;
    }
  });
};
