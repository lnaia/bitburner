import type {NS} from './NetscriptDefinitions';

export async function main(ns: NS) {
  const host = ns.args[0].toString();
  const threads = +ns.args[1];
  const stock = !!(ns.args[2] ?? false);

  await ns.grow(host, {threads, stock});
}
