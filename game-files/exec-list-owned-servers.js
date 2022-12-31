export const main = (ns) => {
    const servers = ns.getPurchasedServers();
    servers.forEach((host) => {
        ns.tprint(host);
    });
};
