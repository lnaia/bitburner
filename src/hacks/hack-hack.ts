import { NS } from "@ns";

export async function main(ns: NS) {
  const host = ns.args[0].toString();
  const threads = +ns.args[1];
  const stock = !!(ns.args[2] ?? false);
  const delay = +ns.args[3] ?? 0;

  if (delay > 0) {
    await ns.sleep(delay);
  }

  // ns.tprint(`hack debug: stock: ${stock}, threads:${threads}`);
  await ns.hack(host, { threads, stock });
}
