import { NS } from "@ns";

export const extractArgs = (ns: NS) => {
  const host = ns.args[0].toString();
  const threads = +ns.args[1];
  const stock = !!(ns.args[2] ?? false);
  const delay = +ns.args[3] ?? 0;

  return {
    host,
    threads,
    stock,
    delay,
  };
};
