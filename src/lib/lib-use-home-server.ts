import { HOME_SERVER, HOME_SERVER_USAGE_FILE } from "constants";
import { log } from "lib/lib-log";
import { NS } from "@ns";

export const isHomeUsageAllowed = (ns: NS) => {
  return ns.fileExists(HOME_SERVER_USAGE_FILE, HOME_SERVER);
};

export const toggleHomeUsage = (ns: NS) => {
  const homeUsageAllowed = isHomeUsageAllowed(ns);
  log(ns, `start:${HOME_SERVER_USAGE_FILE} is allowed:${homeUsageAllowed}`);

  if (homeUsageAllowed) {
    ns.rm(HOME_SERVER_USAGE_FILE, HOME_SERVER);
  } else {
    ns.write(HOME_SERVER_USAGE_FILE, ".");
  }

  log(
    ns,
    `finish:${HOME_SERVER_USAGE_FILE} is allowed:${isHomeUsageAllowed(ns)}`
  );
};
