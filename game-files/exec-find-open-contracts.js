import { printObjList } from './lib-print-obj-list';
import { hostInfo } from './lib-host-info'

/** @param {NS} ns */
export async function main(ns) {
    const targetHost = 'i-do-not-exist' // on purpose, this way we deep scan the network for everything
    if (!targetHost) {
        ns.tprint("no host given - nothing to do")
        ns.exit()
    }

    const shouldExcludeHost = (host) => !/remote-server|home|darkweb/.test(host)
    const connectedHosts = (host) => ns.scan(host).filter(shouldExcludeHost)
    const visitedHosts = [];
    const contractsFound = {};
    const scanOpenContracts = (host) =>
        ns.ls(host, 'cct').filter((contract) =>
            ns.codingcontract.getNumTriesRemaining(contract, host) > 0)

    const findHost = ({
        path = [],
        baseHost
    }) => {
        // connects are bi-directional, should avoild loops:
        // a -> b -> a -> b (...)
        if (visitedHosts.includes(baseHost)) {
            return [];
        } else {
            visitedHosts.push(baseHost);

            const contracts = scanOpenContracts(baseHost)
            if (contracts.length) {
                const key = [...path, baseHost].join('>>')
                contractsFound[key] = contracts.map((contract) => {
                    return {
                        contract,
                        type: ns.codingcontract.getContractType(contract, baseHost)
                    };
                })
            }
        }

        if (baseHost === targetHost) {
            return [...path, baseHost]
        }

        const adjacentHosts = connectedHosts(baseHost);
        for (let adjacentHost of adjacentHosts) {
            const result = findHost({
                path: [...path, baseHost],
                baseHost: adjacentHost
            })

            if (result.length) {
                return result;
            }
        }

        return [];
    }

    findHost({ baseHost: 'home' })
    if (Object.keys(contractsFound)) {
        Object.entries(contractsFound).forEach(([host, contracts]) => {
            ns.tprint(`\n${host}:`)
            contracts.forEach((contract) => {
                ns.tprint(`${contract.contract} - ${contract.type}`)
            })
        })
    } else {
        ns.tprint('no open contracts found - nothing to do')
    }
}