/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog('sleep')
    ns.disableLog('getHostname')
    ns.disableLog('peek')
    ns.disableLog('writePort')
    
    const currentHost = ns.getHostname();
    const readData = () => {
        try {
            return JSON.parse(ns.peek(1)) // HACK_INSTRUCTIONS 
        } catch (e) {
            return [null, null]
        }
    }

    while (true) {
        const [host, action] = readData()

        if (host && action) {
            try {
                if (action === 'weaken') {
                    await ns.weaken(host);
                } else if (action === 'grow') {
                    await ns.grow(host);
                } else {
                    await ns.hack(host);
                }
            } catch (e) {
                ns.print(`${currentHost}: action-failed ${e?.message}`)
            }

            ns.writePort(2, JSON.stringify({
                host: currentHost,
                report: 'action-complete'
            }))
        }

        await ns.sleep(1000)
    }
}