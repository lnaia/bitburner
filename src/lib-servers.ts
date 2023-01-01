import { REMOTE_SERVER_PREFIX } from './constants';
import type { NS } from './NetscriptDefinitions';
import type { StatusReport } from './typings';


export const buyServer = (ns: NS): StatusReport => {
    const ownServers = ns.getPurchasedServers();
    if (ownServers.length >= ns.getPurchasedServerLimit()) {
        return [false, 'buyServer: failed, purchase limit reached'];
    }

    const purchaseServerRam = 2;
    const cost = ns.getPurchasedServerCost(purchaseServerRam);
    if (ns.getServerMoneyAvailable('home') > cost) {
        const serverId = ownServers.length + 1;
        const newHostname = `${REMOTE_SERVER_PREFIX}-${serverId}`;
        const confirmedHostname = ns.purchaseServer(newHostname, purchaseServerRam);

        if (confirmedHostname.length) {
            return [
                true,
                `buyServer: success, ${confirmedHostname}@${purchaseServerRam}`,
            ];
        } else {
            return [false, 'buyServer: failed'];
        }
    }

    return [false, 'buyServer: failed, not enough funds'];
};

export const upgradeServer = (ns: NS, host: string): StatusReport => {
    const currentRam = ns.getServerMaxRam(host);
    const newRamValue = currentRam * 2;
    const upgradeCost = Math.round(
        ns.getPurchasedServerUpgradeCost(host, newRamValue)
    );

    if (ns.getServerMoneyAvailable('home') >= upgradeCost) {
        ns.upgradePurchasedServer(host, newRamValue);
        return [true, `upgradeServer: success, ${host} upgraded to ${newRamValue}`];
    }

    return [false, `upgradeServer: failed, ${host} not enough funds`];
};

export const upgradeServers = (ns: NS): StatusReport[] => {
    return ns.getPurchasedServers().map(host => upgradeServer(ns, host));
};