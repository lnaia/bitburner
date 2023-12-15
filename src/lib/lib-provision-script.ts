import { NS } from "@ns";
import type { StatusReport } from "../typings";

const uploadScript = (ns: NS, host: string, script: string) => {
  if (host === "home") {
    return;
  }

  if (ns.fileExists(script, host)) {
    ns.rm(script, host);
  }

  ns.scp(script, host, "home");
};

const stopScript = (ns: NS, host: string, script: string) => {
  const foundScript = ns
    .ps(host)
    .find((foundScript) => foundScript.filename === script);

  if (foundScript) {
    ns.kill(foundScript.pid);
  }
};

export const provision = (
  ns: NS,
  host: string,
  script: string
): StatusReport => {
  stopScript(ns, host, script);
  uploadScript(ns, host, script);

  return [true, `${host}: script uploaded`];
};
