import {files} from './lib-files-to-download.js';

/** @param {NS} ns */
export async function main(ns) {
  const scriptArgs = ['lnaia', '2ca322ffbde25a80c39afb0c1e5cf731'];

  for (let file of files) {
    ns.exec('download-src-files.js', 'home', 1, ...scriptArgs, file);
    await ns.sleep(1000);
  }

  ns.tprintf('download finished');
}
