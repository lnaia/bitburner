import { findProfitableHost, findPotentialMaxProfitHost } from './lib-find-profitable-host.js'
import { discoverHosts } from './lib-discover-hosts.js'
import { HACK_SCRIPT } from './constants.js'

export const calculateThreads = ({ ns, script, scriptMemory, host }) => {
    const maxRam = ns.getServerMaxRam(host)
    const usedRam = ns.getServerUsedRam(host)
    const availableRam = maxRam - usedRam
    return Math.floor(availableRam / scriptMemory)
}

export const execScript = ({ host, ns, script, scriptArgs }) => {
    const scriptMemory = ns.getScriptRam(script)
    const numTreads = calculateThreads({ ns, script, scriptMemory, host })
    const availableMemory = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
    if (scriptMemory > availableMemory) {
        return [false, `provisionScript: failed, insuficient ram@${host}, need: ${scriptMemory} got ${availableMemory}`];
    }

    // exec
    const pid = ns.exec(script, host, numTreads, ...scriptArgs)
    if (pid) {
        return [true, `provisionScript: success, ${script} running on ${host} w/ ${numTreads} threads.`];
    } else {
        return [false, `provisionScript: failed, exec ${script} on ${host}`];
    }
}

const HOST_SCRIPT = {
    // host: ticks-passed
};

const provision = ({ ns, host, script, scriptArgs, forceUpload = false }) => {
    const upload = () => {
        // delete file if it exists on remote server
        if (ns.fileExists(script, host)) {
            ns.rm(script, host)
        }
        // upload script
        ns.scp(script, host)
    }

    const startScript = () => {
        return execScript({
            ns,
            host,
            script,
            scriptArgs
        })
    }

    const respawn = () => {
        ns.kill(foundScript.pid, host)
        return startScript()
    }

    if (forceUpload) {
        upload()
    }

    const scriptRamCost = ns.getScriptRam(script)
    const serverMaxRam = ns.getServerMaxRam(host)
    const potentialThreads = Math.floor(serverMaxRam / scriptRamCost)
    const foundScript = ns.ps(host).find((foundScript) => foundScript.filename === script)
    /**
     * 3600 1h
     * 1800 30m
     * 900  15m
     * 450  7m 30s
     */
    const MIN_TICKS_REQUIRED = 3600 // 1 tick = 1 second;  900s === 15m

    if (!(host in HOST_SCRIPT)) {
        HOST_SCRIPT[host] = 0
    } else {
        HOST_SCRIPT[host] += 1
    }

    if (foundScript) {
        // should respawn with more threads?
        if (foundScript.threads < potentialThreads) {
            respawn()
        }

        // should respawn because args changed?
        if (foundScript.args[0] !== scriptArgs[0]) {
            if (HOST_SCRIPT[host] > MIN_TICKS_REQUIRED) {
                HOST_SCRIPT[host] = 0
                respawn()
            }
        }
    } else {
        upload()
        return startScript()
    }
}

export const autoProvisionHosts = ({ ns }) => {
    const ownedServers = ns.getPurchasedServers()
    const hackedServers = discoverHosts({ ns }).filter((host) => ns.hasRootAccess(host) && ns.getServerMaxRam(host) > 0)
    const hosts = [...ownedServers, ...hackedServers]

    for (let host of hosts) {
        const profitableHost = 'zeus-med' // findProfitableHost({ ns });
        const status = provision({
            script: HACK_SCRIPT,
            host,
            ns,
            scriptArgs: [profitableHost]
        })

        if (status) {
            ns.print(status)
        }
    }
}