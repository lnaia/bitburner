import { HOME_SERVER, HOME_SERVER_USAGE_FILE } from "constants";
import { log } from "lib/lib-log";
import { NS } from "@ns";

export const isHomeUsageAllowed = (ns: NS) => {
  return ns.fileExists(HOME_SERVER_USAGE_FILE, HOME_SERVER);
};

export const toggleHomeUsage = (ns: NS) => {
  const homeUsageAllowed = isHomeUsageAllowed(ns);
  log(ns, `${HOME_SERVER_USAGE_FILE} is allowed? ${homeUsageAllowed}`);

  if (homeUsageAllowed) {
    const result = ns.rm(HOME_SERVER_USAGE_FILE, HOME_SERVER);
    log(ns, `rm ${HOME_SERVER_USAGE_FILE} attempted with ${result}`);
  } else {
    ns.write(HOME_SERVER_USAGE_FILE, ".");
    log(
      ns,
      `rm ${HOME_SERVER_USAGE_FILE} attempted with ${isHomeUsageAllowed(ns)}`
    );
  }
};
