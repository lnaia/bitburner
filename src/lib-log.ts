import type {NS} from './NetscriptDefinitions';

const getFormattedDate = () => {
  function addLeadingZeros(n: number) {
    if (n <= 9) {
      return '0' + n;
    }
    return n;
  }
  const currentDateTime = new Date();
  return (
    currentDateTime.getFullYear() +
    '-' +
    addLeadingZeros(currentDateTime.getMonth() + 1) +
    '-' +
    addLeadingZeros(currentDateTime.getDate()) +
    ' ' +
    addLeadingZeros(currentDateTime.getHours()) +
    ':' +
    addLeadingZeros(currentDateTime.getMinutes()) +
    ':' +
    addLeadingZeros(currentDateTime.getSeconds())
  );
};
export const log = (ns: NS, msg: string, level = 'debug') => {
  ns.disableLog('ALL');
  const date = getFormattedDate();

  ns.print(`${date}@${level}: ${msg}`);
};
