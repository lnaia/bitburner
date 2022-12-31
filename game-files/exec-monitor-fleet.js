import { discoverHosts } from './lib-discover-hosts.js'
import { humanReadableMoney } from './lib-utils.js'

export async function main(ns) {
    ns.disableLog('ALL')

    const listRootedServers = () => {
        const ownedServers = ns.getPurchasedServers()
        const hackedServers = discoverHosts({ ns }).filter((host) => ns.hasRootAccess(host) && ns.getServerMaxRam(host) > 0)
        return [...ownedServers, ...hackedServers]
    }

    const generateReport = () => {
        const report = {
            date: new Date(),
            totalServers: 0,
            totalMoneyAvailable: 0,
            ram: { available: 0, free: 0, percentFree: `${0} %` },
            serversRam: {}, // ram: count            
            scripts: {} //script: { totalThreads: count, args: { [name.join(',')]: threadCount }}
        };



        for (let host of listRootedServers()) {
            const maxRam = ns.getServerMaxRam(host)
            const usedRam = ns.getServerUsedRam(host)

            report.totalServers += 1
            report.totalMoneyAvailable += ns.getServerMoneyAvailable(host)

            report.ram.available += maxRam
            report.ram.free += Math.floor(maxRam - usedRam)

            const percentRamFree = (report.ram.free * 100) / report.ram.available
            report.ram.percentFree = `${Math.round(percentRamFree)}%`

            const serverRamKey = maxRam
            if (!(serverRamKey in report.serversRam)) {
                report.serversRam[serverRamKey] = 1
            } else {
                report.serversRam[serverRamKey] += 1
            }

            for (let runningScript of ns.ps(host)) {
                if (!(runningScript.filename in report.scripts)) {
                    report.scripts[runningScript.filename] = {
                        totalThreads: runningScript.threads,
                        args: {
                            [runningScript.args.join(',')]: runningScript.threads
                        }
                    }
                } else {
                    report.scripts[runningScript.filename].totalThreads += runningScript.threads
                    const argsKey = runningScript.args.join(',')
                    if (!(argsKey in report.scripts[runningScript.filename].args)) {
                        report.scripts[runningScript.filename].args[argsKey] = runningScript.threads
                    } else {
                        report.scripts[runningScript.filename].args[argsKey] += runningScript.threads
                    }
                }
            }
        }

        return {
            ...report,
            totalMoneyAvailable: humanReadableMoney({
                ns,
                money: Math.round(report.totalMoneyAvailable)
            })
        };
    };

    const WAIT_TIME = 500 // 500 ms
    while (true) {
        const report = generateReport()

        // keep last snapshot in file
        const data = `${JSON.stringify(report)}\n`
        ns.write('monitor-fleet-report-log.txt', data, 'w')

        ns.clearLog()
        ns.print(JSON.stringify(report, null, 2));

        await ns.sleep(WAIT_TIME)
    }
}