import { printObjList } from './lib-print-obj-list';
import { hostInfo } from './lib-host-info'

/** @param {NS} ns */
export async function main(ns) {
    const targetHost = ns.args[0]
    if (!targetHost) {
        ns.tprint("no host given - nothing to do")
        ns.exit()
    }

    const shouldExcludeHost = (host) => !/remote-server|home|darkweb/.test(host)
    const connectedHosts = (host) => ns.scan(host).filter(shouldExcludeHost)
    const visitedHosts = [];

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
        }

        if (baseHost === targetHost) {
            ns.tprint(`${targetHost} found`)
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

    const path = findHost({ baseHost: 'home' })
    ns.tprint('path: ', path.join(' >> '))

    // can we display pretty info on host remotely?
    if (path.length) {
        printObjList(
            [hostInfo({ host: targetHost, ns })],
            ns.tprint
        )
    } else {
        ns.tprint(`${targetHost} couldn't be found - nothing to do`)
    }
}