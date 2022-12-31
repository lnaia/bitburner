
export const humanReadableMoney = (money: number) => {
    const str: string[] = [];
    const charList = Math.round(money).toString().split('').reverse();

    let groupCounter = 0;
    const GROUPS_OF = 3;
    charList.forEach(c => {
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
