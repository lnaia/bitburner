/** @param {NS} ns */
export async function main(ns) {
  const scriptArgs = ['USER', 'GIST_ID'];
  const files = ['lib.js', 'exec-coordinator.js'];

  files.forEach(file => {
    ns.exec('download-files.js', 'home', 1, ...scriptArgs, file);
  });
}
