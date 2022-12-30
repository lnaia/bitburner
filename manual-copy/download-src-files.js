export async function main(ns) {
    const [gistId, user, ...files] = ns.args

    if (!gistId || !user || files.length === 0) {
        ns.tprint(`err missing args: userId@${userId}, gistId@${gistId}, files@${files.join(', ')}`)
        ns.exit()
    }

    for (let file of files) {
        const url = `https://gist.githubusercontent.com/${user}/${gistId}/raw/${file}`
        const result = await ns.wget(url, file)
        const msg = result ? `ok...${url}` : `err...${url}`

        ns.print(msg)
    }
}