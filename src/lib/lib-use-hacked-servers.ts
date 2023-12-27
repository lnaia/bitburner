import { HOME_SERVER, HACKED_SERVERS_USAGE_FILE } from "constants";
import { log } from "lib/lib-log";
import { NS } from "@ns";

export const isHackedServerUsageAllowed = (ns: NS) => {
  return ns.fileExists(HACKED_SERVERS_USAGE_FILE, HOME_SERVER);
};

export const toggleHackedServers = (ns: NS) => {
  const usageAllowed = isHackedServerUsageAllowed(ns);
  log(ns, `start:${HACKED_SERVERS_USAGE_FILE} is allowed:${usageAllowed}`);

  if (usageAllowed) {
    ns.rm(HACKED_SERVERS_USAGE_FILE, HOME_SERVER);
  } else {
    ns.write(HACKED_SERVERS_USAGE_FILE, ".");
  }

  log(
    ns,
    `finish:${HACKED_SERVERS_USAGE_FILE} is allowed:${isHackedServerUsageAllowed(
      ns
    )}`
  );
};
