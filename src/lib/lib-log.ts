import { NS } from "@ns";

const getFormattedDate = () => {
  const addLeadingZeros = (n: number) => {
    if (n <= 9) {
      return "0" + n;
    }
    return n;
  };

  const currentDateTime = new Date();
  return (
    currentDateTime.getFullYear() +
    "-" +
    addLeadingZeros(currentDateTime.getMonth() + 1) +
    "-" +
    addLeadingZeros(currentDateTime.getDate()) +
    " " +
    addLeadingZeros(currentDateTime.getHours()) +
    ":" +
    addLeadingZeros(currentDateTime.getMinutes()) +
    ":" +
    addLeadingZeros(currentDateTime.getSeconds())
  );
};

type ErrorLevel = "debug" | "fatal";
export const log = (ns: NS, msg: string, level?: ErrorLevel) => {
  ns.disableLog("ALL");
  const date = getFormattedDate();

  const logMsg = `${date}@${level ? level : "debug"}: ${msg}`;
  ns.print(logMsg);
  if (level === "fatal") {
    ns.tprint(logMsg);
  }
};

export const logClient = (ns: NS) => {
  return (msg: string) => log(ns, msg);
};
