import { printObjList } from './lib-print-obj-list.js'
import { hostInfo } from './lib-host-info.js'
import { findProfitableHost } from './lib-find-profitable-host.js'

/** @param {NS} ns */
export async function main(ns) {
    ns.tail();
    ns.disableLog('ALL');
    
    let host = ns.args[0]
    if (!host) {
        host = findProfitableHost({ ns })
    }
    
    while(true) {     
        ns.clearLog(host);   
        printObjList([hostInfo({ host, ns })], ns.print)  
        await ns.sleep(200)
    }
}