export const printObjList = (
  list: unknown[],
  print: (...args: string[]) => void
) => {
  const genStr = (max: number, char = ' ', curr = 0): string => {
    if (curr === max) {
      return char;
    }

    return char + genStr(max, char, curr + 1);
  };

  const longestStr = (list: string[]): [string, number] =>
    list.reduce(
      (acc, str) => {
        if (str.length > acc[1]) {
          return [str, str.length];
        } else {
          return acc;
        }
      },
      ['', 0]
    );

  const rightPad = (str: string, len: number): string => {
    if (str.length > len) {
      const arr = str.split('');
      arr.splice(0, len);
      return arr.join('');
    } else if (str.length === len) {
      return str;
    }

    const whiteSpaceCount = len - str.length;

    return `${str}${genStr(whiteSpaceCount)}`;
  };

  const forceString = (val: string | number) => {
    if (typeof val !== 'string') {
      try {
        return val.toString();
      } catch (e) {
        print('toString failed on type:', typeof val, ' with ', e);
        return `${val}`;
      }
    }
    return val;
  };

  const headers = Object.keys(list[0]);
  const longestHeader = longestStr(headers);
  const findLongestValue = (
    acc: [string, number],
    obj: {[key: string]: string}
  ): [string, number] => {
    const longestVals = Object.values(obj)
      .map(forceString)
      .sort((a, b) => b.length - a.length);
    if (longestVals[0].length > acc[1]) {
      return [longestVals[0], longestVals[0].length];
    } else {
      return acc;
    }
  };
  const longestValue = list.reduce<[string, number]>(
    findLongestValue,
    longestHeader
  );

  const longestColumn =
    longestHeader[1] > longestValue[1] ? longestHeader : longestValue;

  const headerRow: string[] = [];
  headers.forEach(header => {
    headerRow.push(rightPad(header, longestColumn[1] + 1));
  });

  const rows: string[] = [];
  list.forEach(obj => {
    const objVals = Object.values(obj).map(val =>
      rightPad(forceString(val), longestColumn[1] + 1)
    );
    rows.push(objVals.join(''));
  });

  print(headerRow.join(''));
  rows.forEach(row => print(row));
};
