import { REMOTE_SERVER_PREFIX } from './constants.js';
import { getRoot } from './lib-get-root.js'

const shouldExcludeHost = (host) => {
    const regex = new RegExp(`${REMOTE_SERVER_PREFIX}|home|darkweb`)
    return !regex.test(host)
}

export const discoverHosts = ({ ns, onlyHackable = true }) => {
    const playerHackingLevel = ns.getHackingLevel()
    const connectedHosts = (host) => ns.scan(host).filter(shouldExcludeHost)
    const visitedHosts = [];
    const visitHost = ({ baseHost }) => {
        if (visitedHosts.includes(baseHost)) {
            return;
        } else if (shouldExcludeHost(baseHost)) {
            visitedHosts.push(baseHost)
        }

        connectedHosts(baseHost).forEach((host) =>
            visitHost({ baseHost: host }))
    }

    visitHost({ baseHost: 'home' })

    if (!onlyHackable) {
        return visitedHosts;
    }
    // only return hosts that are hackable
    return visitedHosts.filter((host) => {
        try {
            return playerHackingLevel >= ns.getServerRequiredHackingLevel(host)
        } catch (e) {
            ns.print('unable to get host req hacking level: ', e.message)
            return false;
        }
    });
}

export const autoRootHosts = ({ ns }) => {
    discoverHosts({ ns }).forEach((host) => {
        const status = getRoot({ ns, host })
        if (!status[0]) {
            ns.print(`autoRootHosts@${host}: ${status}`)
        }
    })
}