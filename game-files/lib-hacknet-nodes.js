const availableFunds = (ns) => ns.getServerMoneyAvailable("home");

export const buyNode = ({ ns }) => {
    const cost = ns.hacknet.getPurchaseNodeCost()
    if (availableFunds(ns) >= cost) {
        ns.hacknet.purchaseNode();
        return [true, 'buyNode: success']
    }

    return [false, 'buyNode: failed, not enough funds']
}

export const upgradeNode = ({ ns, nodeIndex }) => {
    const upgradeType = [];

    const upgradeRam = () => {
        const costs = ns.hacknet.getRamUpgradeCost(nodeIndex, 1);
        if (availableFunds(ns) >= costs) {
            ns.hacknet.upgradeRam(nodeIndex, 1)
            upgradeType.push('ram')
        }
    }

    const upgradeLevel = () => {
        const costs = ns.hacknet.getLevelUpgradeCost(nodeIndex, 1);
        if (availableFunds(ns) >= costs) {
            ns.hacknet.upgradeLevel(nodeIndex, 1)
            upgradeType.push('level')
        }
    }

    const upgradeCore = () => {
        const costs = ns.hacknet.getCoreUpgradeCost(nodeIndex, 1);
        if (availableFunds(ns) >= costs) {
            ns.hacknet.upgradeCore(nodeIndex, 1)
            upgradeType.push('core')
        }
    }

    upgradeRam();
    upgradeLevel();
    upgradeCore();

    return [upgradeType.length > 0, upgradeType.join(', ')];
}

export const upgradeNodes = ({ ns }) => {
    const nodes = ns.hacknet.numNodes();
    for (let i = 0; i < nodes; i += 1) {
        const status = upgradeNode({ ns, nodeIndex: i })
        if (status[0]) {
            ns.print(`upgradeNodes: ${i}-${status[0]} ${status[1]}`)
        }
    }
}