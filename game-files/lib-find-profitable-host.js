import { discoverHosts } from './lib-discover-hosts.js'
import { printObjList } from './lib-print-obj-list.js'

const hackValuePerHour = ({
    curMoney,
    hackTime,
    hackAmount,
}) => {
    const millisecondsInAnHour = 60 * 60 * 1000;
    try {
        const amountPerHack = hackAmount * curMoney;
        return (millisecondsInAnHour / hackTime) * amountPerHack
    } catch (e) {
        ns.print('error calculating hackValuePerHour: ', e.message)
        return 0
    }
}

const findRootedHostsWithMoney = ({ ns }) => {
    return discoverHosts({ ns })
        .filter(host => ns.hasRootAccess(host) && ns.getServerMaxMoney(host) > 1)
        .map((host) => {
            const maxMoney = ns.getServerMaxMoney(host)
            const hostMoney = ns.getServerMoneyAvailable(host)
            const curMoney = hostMoney > 0 ? hostMoney : 1
            const percentMissingToMax = (100 - ((curMoney * 100) / maxMoney)).toFixed(4)
            const hackTime = ns.getHackTime(host)
            const hackAmount = ns.hackAnalyze(host).toFixed(4)
            const growthAmount = (() => {
                const val = Math.ceil(maxMoney / curMoney);
                return val > 0 ? val : 1
            })()
            const growTimes = Math.ceil(ns.growthAnalyze(host, growthAmount))
            const moneyPerHour = Math.round(hackValuePerHour({
                curMoney,
                hackTime,
                hackAmount
            }))
            const theoreticalMoneyPerHour = Math.round(hackValuePerHour({
                curMoney: maxMoney,
                hackTime,
                hackAmount
            }))
            return {
                host,
                mm: maxMoney,
                cm: Math.round(curMoney),
                '% missing': percentMissingToMax,
                h: ns.getServerRequiredHackingLevel(host),
                sec: Math.round(ns.getServerSecurityLevel(host)),
                msec: Math.round(ns.getServerMinSecurityLevel(host)),
                gt: growTimes,
                ht: Math.round(hackTime)
                // MPH: moneyPerHour,
                // tMPH: theoreticalMoneyPerHour
            }
        })
}

export const findPotentialMaxProfitHosts = ({ ns, currentMoney = true, maxMoney = false }) => {
    const hosts = findRootedHostsWithMoney({ ns })
        .sort((a, b) => {
            if (currentMoney) {
                return b.cm - a.cm
            }

            if (maxMoney) {
                return b.mm - a.mm
            }

            return b.tMPH - a.tMPH
        })

    return hosts
}

export const findPotentialMaxProfitHost = ({ ns, currentMoney = true, maxMoney = false }) => {
    const hosts = findPotentialMaxProfitHosts({ ns, maxMoney, currentMoney })
    return hosts[0].host
}

// most profitable per hour
export const findProfitableHosts = ({ ns }) => {
    // top 5 lowest security level
    // of these: sort by most money available
    const hosts = findRootedHostsWithMoney({ ns })
        .sort((a, b) => {
            // lowest hack time
            // return a.ht - b.ht

            // highest max money
            return b.mm - a.mm

            // lowest hacking level
            return a.h - b.h
        });

    // if (ns.getHackingLevel() > 200) {
    //     return hosts.filter((host) => {
    //         return host.msec >= 10 && host.cm > 10
    //     })
    // }

    return hosts
}

export const findProfitableHost = ({ ns }) => findProfitableHosts({ ns })[0].host