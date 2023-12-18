import { NS } from "@ns";
import { extractArgs } from "./hack-helper";

export async function main(ns: NS) {
  const { host, threads, stock, delay } = extractArgs(ns);

  if (delay > 0) {
    await ns.sleep(delay);
  }

  await ns.grow(host, { threads, stock });
}
