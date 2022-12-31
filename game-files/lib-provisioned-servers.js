import { REMOTE_SERVER_PREFIX } from './constants.js'

export const buyServer = ({ ns }) => {
    const ownServers = ns.getPurchasedServers();
    if (ownServers.length >= ns.getPurchasedServerLimit()) {
        return [false, 'buyServer: failed, purchase limit reached'];
    }

    const purchaseServerRam = 8;
    const cost = ns.getPurchasedServerCost(purchaseServerRam)
    if (ns.getServerMoneyAvailable('home') > cost) {
        const serverId = ownServers.length + 1
        const newHostname = `${REMOTE_SERVER_PREFIX}-${serverId}`
        const confirmedHostname = ns.purchaseServer(newHostname, purchaseServerRam)

        if (confirmedHostname) {
            [true, `buyServer: success, ${confirmedHostname}@${purchaseServerRam}`]
        } else {
            [false, 'buyServer: failed']
        }
    }

    return [false, 'buyServer: failed, not enough funds']
};

export const upgradeServer = ({ ns, host }) => {
    const currentRam = ns.getServerMaxRam(host)
    const newRamValue = currentRam * 2
    const upgradeCost = Math.round(ns.getPurchasedServerUpgradeCost(host, newRamValue))

    if (ns.getServerMoneyAvailable('home') >= upgradeCost) {
        ns.upgradePurchasedServer(host, newRamValue)
        return [true, `upgradeServer: success, ${host} upgraded to ${newRamValue}`]
    }

    return [false, `upgradeServer: failed, ${host} not enough funds`]
}

export const upgradeServers = ({ ns }) => {
    for (let host of ns.getPurchasedServers()) {
        const status = upgradeServer({ ns, host })
        if (status[0]) {
            ns.print(status)
        }
    }
}