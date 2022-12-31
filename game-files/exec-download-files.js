/** @param {NS} ns */
export async function main(ns) {
    const scriptArgs = [
        'lnaia',
        '2ca322ffbde25a80c39afb0c1e5cf731',
        'exec-list-owned-servers.js'
    ]

    ns.spawn('download-files.js', 1, ...scriptArgs)
}