import type {NS} from './NetscriptDefinitions';

export async function main(ns: NS) {
  const host = ns.args[0].toString();
  const threads = +ns.args[1];
  await ns.hack(host, {threads});
}
