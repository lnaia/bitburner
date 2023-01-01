/** @param {NS} ns */
export async function main(ns) {
  const scriptArgs = ['lnaia', '2ca322ffbde25a80c39afb0c1e5cf731'];
  const files = [
    'lib-auto-provision-hosts.js',
    'lib-auto-root-hosts.js',
    'lib-calculate-threads.js',
    'lib-discover-hosts.js',
    'lib-hackable-hosts.js',
    'lib-host-info.js',
    'lib-human-readable-money.js',
    'lib-nodes.js',
    'lib-provision.js',
    'lib-servers.js',
    'lib-print-obj-list.js',
    'exec-coordinator.js',
    'exec-provision-home.js',
    'exec-find-host.js',
    'hack.js',
    'constants.js',
  ];

  for (let file of files) {
    ns.exec('download-files.js', 'home', 1, ...scriptArgs, file);
    await ns.sleep(3000);
  }
}
