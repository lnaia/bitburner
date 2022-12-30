"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const main = (ns) => {
    const servers = ns.getPurchasedServers();
    servers.forEach((host) => {
        ns.tprint(host);
    });
};
exports.main = main;
//# sourceMappingURL=exec-list-owned-servers.js.map