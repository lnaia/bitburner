import type { NS } from './NetscriptDefinitions';
import type { StatusReport } from './typings';
import { calculateThreads } from './lib-calculate-threads';

export const provision = (
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