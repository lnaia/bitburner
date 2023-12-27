import { HOME_SERVER, HACKNET_SERVERS_USAGE_FILE } from "constants";
import { log } from "lib/lib-log";
import { NS } from "@ns";

export const isHacknetServersUsageAllowed = (ns: NS) => {
  return ns.fileExists(HACKNET_SERVERS_USAGE_FILE, HOME_SERVER);
};

export const toggleHacknetServersUsage = (ns: NS) => {
  const usageAllowed = isHacknetServersUsageAllowed(ns);
  log(ns, `start:${HACKNET_SERVERS_USAGE_FILE} is allowed:${usageAllowed}`);

  if (usageAllowed) {
    ns.rm(HACKNET_SERVERS_USAGE_FILE, HOME_SERVER);
  } else {
    ns.write(HACKNET_SERVERS_USAGE_FILE, ".");
  }

  log(
    ns,
    `finish:${HACKNET_SERVERS_USAGE_FILE} is allowed:${isHacknetServersUsageAllowed(
      ns
    )}`
  );
};
