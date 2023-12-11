import type {NS} from './NetscriptDefinitions';

export const ensureScriptIsPresent = (ns: NS, host: string, script: string) => {
  if (!ns.fileExists(script, host)) {
    ns.scp(script, host, 'home');
  }
};

export const cleanupExistingScripts = async (
  ns: NS,
  host: string,
  scripts: string[]
) => {
  ns.disableLog('ALL');

  for (const script of scripts) {
    if (!ns.fileExists(script, host)) {
      continue;
    }

    const foundScript = ns
      .ps(host)
      .find(runningScript => runningScript.filename === script);

    if (foundScript) {
      ns.kill(foundScript.pid);
      await ns.sleep(1000); // wait for kill to do it's thing
    }

    ns.rm(script, host);
  }
};
