import type {NS} from './NetscriptDefinitions';

export async function main(ns: NS) {
  const host = ns.args[0].toString();
  const threads = +ns.args[1];
  const stock = !!(ns.args[2] ?? false);
  const delay = +ns.args[3] ?? 0;

  if (delay > 0) {
    await ns.sleep(delay);
  }

  await ns.hack(host, {threads, stock});
}
