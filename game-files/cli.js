import { findProfitableHosts } from './lib-find-profitable-host.js'
import { printObjList } from './lib-print-obj-list.js'

const MONITOR_MONEY = 'monitor-money'
const MONITOR_FLEET = 'monitor-fleet'
const PROVISION_HOME = 'provision-home'

export async function main(ns) {
    const [action] = ns.args

    if (action === MONITOR_MONEY) {
        await monitorMoney({ ns })
    } else if (action === MONITOR_FLEET) {
        const monitorFleetScript = 'exec-monitor-fleet.js'
        if (ns.ps().find((s) => s.filename === monitorFleetScript)) {
            ns.kill(monitorFleetScript)
        }
        ns.spawn(monitorFleetScript)
        await ns.sleep(1000 * 10)
        ns.exit();
    } else if (action === PROVISION_HOME) {
        const target = ns.args[1]
        if (!target) {
            ns.tprint('err: no target given')
            ns.exit()
        }
        ns.spawn('exec-provision-home.js', 1, target)
        await ns.sleep(1000 * 10)
        ns.exit();
    }

    const root = 'cli.js'
    if (!action) {
        ns.tprint(`
            > run ${root} <action> <options?>, where actions is one of:
            ${MONITOR_MONEY}, monitors rooted servers for hacking potential
            ${MONITOR_FLEET}, monitors and logs a fleet wide report
            ${PROVISION_HOME} <target>, provisions home server to hack a given target
            `)
        ns.exit();
    }
}

const monitorMoney = async ({ ns }) => {
    ns.disableLog('ALL')
    while (true) {
        const list = findProfitableHosts({
            ns,
        })
        ns.clearLog()
        ns.print(new Date())
        printObjList(list, ns.print)
        await ns.sleep(1000)
    }
}