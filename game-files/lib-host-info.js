export const hostInfo =({ host, ns }) => {
    const moneyMax = ns.getServerMaxMoney(host)
    const moneyCurrent = ns.getServerMoneyAvailable(host)
    const percentDiff = Math.round(100 - (moneyCurrent * 100) / moneyMax)

    return {
        host,
        'max money': moneyMax,
        'cur money': Math.round(moneyCurrent),
        '% diff': percentDiff,
        'req hack': Math.round(ns.getServerRequiredHackingLevel(host)),
        'min sec': Math.round(ns.getServerMinSecurityLevel(host)),
        'cur sec': Math.round(ns.getServerSecurityLevel(host)),
        'ports req': ns.getServerNumPortsRequired(host),
        'total files': ns.ls(host)?.length,
        // 'files': ns.ls(host)?.join(', ')
    };
}

/** @param {NS} ns */
export async function main(ns) {
    ns.tprint('this is a library not an exec - nothing to do')
}