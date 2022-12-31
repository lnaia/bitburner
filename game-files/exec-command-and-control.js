import { buyServer, upgradeServers } from './lib-provisioned-servers.js'
import { buyNode, upgradeNodes } from './lib-hacknet-nodes.js'
import { autoRootHosts } from './lib-discover-hosts.js';
import { autoProvisionHosts } from './lib-provision.js'

/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog('ALL');
    ns.clearLog();
    ns.print(`started@${new Date()}`)

    while (true) {
        let status = null;
        status = buyServer({ ns })
        if (status[0]) {
            ns.print(status)
        }

        upgradeServers({ ns })

        status = buyNode({ ns })
        if (status[0]) {
            ns.print(status)
        }

        upgradeNodes({ ns })
        autoRootHosts({ ns })
        autoProvisionHosts({ ns })

        await ns.sleep(1000)
    }
}