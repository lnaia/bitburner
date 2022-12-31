export const openPorts = ({ host, ns }) => {
    const portEnforcers = {
        'BruteSSH.exe': (h) => ns.brutessh(h),
        'FTPCrack.exe': (h) => ns.ftpcrack(h),
        'relaySMTP.exe': (h) => ns.relaysmtp(h),
        'HTTPWorm.exe': (h) => ns.httpworm(h),
        'SQLInject.exe': (h) => ns.sqlinject(h)
    }

    const countPortEnforcers = () => {
        Object.keys(portEnforcers).reduce((total, portEnforcer) => {
            if (ns.fileExists(portEnforcer), 'home') {
                return total + 1;
            }
            return total;
        }, 0)
    };

    const existingPortEnforcers = countPortEnforcers();
    const portsRequired = ns.getServerNumPortsRequired(host);    
    if (portsRequired > existingPortEnforcers) {
        return [false, `openPorts: failed, ports required ${portsRequired} > ${existingPortEnforcers}`]
    }

    let portsOpen = 0;
    if (portsOpen === portsRequired) {
        return [true]
    }

    for (let [app, cmd] of Object.entries(portEnforcers)) {
        if (ns.fileExists(app, "home")) {
            cmd(host);
            portsOpen += 1;
        }

        // open only what you need - no more
        if (portsOpen === portsRequired) {
            break;
        }
    }

    return [true];
}

export const getRoot = ({ host, ns }) => {
    if (!openPorts({ host, ns })) {
        return [false,`getRootAccess@${host}: unable to open ports`]
    }

    if (!ns.hasRootAccess(host)) {
        try { 
            ns.nuke(host)        
        } catch (e) {
            return [false, `getRootAccess@${host}: unable to nuke: `, e.message]
        }
    }
    
    return [ns.hasRootAccess(host)];
}