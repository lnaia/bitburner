import { NS } from "@ns";
import { REMOTE_SERVER_PREFIX, HOME_SERVER } from "../constants";

export const isAllowedHost = (host: string) => {
  const regex = new RegExp(`${REMOTE_SERVER_PREFIX}|${HOME_SERVER}|darkweb`);
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
