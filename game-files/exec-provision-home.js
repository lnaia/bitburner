import { calculateThreads } from './lib-provision.js'
import { findPotentialMaxProfitHost, findProfitableHost } from './lib-find-profitable-host.js'
import { HACK_SCRIPT } from './constants.js'

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog('ALL')
    
    let targetHost = ns.args[0]
    if (!targetHost) {
        // const targetHost = findPotentialMaxProfitHost({ ns, currentMoney: false, maxMoney: true })
        // const targetHost = findProfitableHost({ ns });
        const targetHost = 'global-pharm'
    }
    
    // kill all running hack scripts
    ns.ps().forEach((runningScript) => {
        const isHackScript = /hack\.js$/.test(runningScript.filename)
        if (isHackScript) {
            ns.kill(runningScript.pid)
        }
    })

    const script = HACK_SCRIPT
    const scriptMemory = ns.getScriptRam(script)
    const numThreads = calculateThreads({ host: 'home', script, scriptMemory, ns })
    const spawnArgs = [script, numThreads, targetHost]
    ns.spawn(...spawnArgs)
}