/** @param {NS} ns */
export async function main(ns) {
  const scriptArgs = ['lnaia', '2ca322ffbde25a80c39afb0c1e5cf731'];
  const files = ['lib.js', 'exec-coordinator.js'];

  files.forEach(file => {
    ns.exec('download-files.js', 'home', 1, ...scriptArgs, file);
  });
}
