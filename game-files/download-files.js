/** @param {NS} ns */
export async function main(ns) {
    const [user, gistId, ...files] = ns.args

    if (!gistId || !user || files.length === 0) {
        ns.ptrint(`err missing args: gistId@${gistId}, user@${user}, files@${files.join(',')}`)
        ns.exit()
    }

    for (let file of files) {
        let backupPath = ''
        if (ns.fileExists(file)) {
            backupPath = `backup.${file}`
            ns.mv('home', file, backupPath)
            ns.tprint(`${file} backed up`)
        }

        const url = `https://gist.githubusercontent.com/${user}/${gistId}/raw/${file}`
        const result = await ns.wget(url, file)
        ns.tprint(`${file} download ${result ? 'ok' : 'error'}`)

        if (result) {
            if (backupPath.length) {
                ns.rm(backupPath)
                ns.tprint(`${file} backup deleted`)
            }
        } else {
            ns.mv('home', backupPath, file)
            ns.tprint(`${file} backup restored`)

        }
    }
}