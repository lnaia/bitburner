/** @param {NS} ns */
export async function main(ns) {
    const host = ns.args[0]
    const moneyThresh = ns.getServerMaxMoney(host) * 0.04;
    const securityThresh = ns.getServerMinSecurityLevel(host) + 5;

    while (true) {
        if (ns.getServerSecurityLevel(host) > securityThresh) {
            await ns.weaken(host);
        } else if (ns.getServerMoneyAvailable(host) < moneyThresh) {
            await ns.grow(host);
        } else {
            await ns.hack(host);
        }
    }
}