export const humanReadableMoney = ({ns, money}) => {
  const str = [];
  const charList = money.toString().split('').reverse();

  let groupCounter = 0;
  const GROUPS_OF = 3;
  charList.forEach(c => {
    // ns.tprint({c, groupCounter, str })
    if (groupCounter < GROUPS_OF) {
      str.push(c);
      groupCounter += 1;
    } else if (groupCounter === GROUPS_OF) {
      str.push('_');
      str.push(c);
      groupCounter = 1;
    }
  });

  return str.reverse().join('');
};

/** @param {NS} ns */
export async function main(ns) {
  const money = 2403891773;
  const str = humanReadableMoney({money, ns});
  ns.tprint(`humanReadableMoney: ${money} vs ${str}`);
}

const a = [
  [28, 16, 38, 36, 3],
  [41, 31, 37, 49, 27],
  [33, 46, 12, 3, 5],
  [39, 33, 47, 36, 32],
  [24, 44, 46, 42, 28],
  [44, 16, 34, 10, 5],
  [27, 21, 37, 16, 10],
  [45, 30, 29, 15, 44],
  [1, 40, 41, 46, 26],
];
