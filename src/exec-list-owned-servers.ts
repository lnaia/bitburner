import { NS } from "./NetscriptDefinitions";

export const main = (ns: NS) => {
    const servers = ns.getPurchasedServers();
    servers.forEach((host) => {
        ns.print(host)
    })
}
