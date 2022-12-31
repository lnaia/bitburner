export const humanReadableMoney = ({
    ns,
    money
}) => {
    const str = [];
    const charList = money.toString().split('').reverse()

    let groupCounter = 0;
    const GROUPS_OF = 3
    charList.forEach((c) => {    
        // ns.tprint({c, groupCounter, str })    
        if (groupCounter < GROUPS_OF) {
            str.push(c)
            groupCounter += 1
        } else if (groupCounter === GROUPS_OF) {            
            str.push('_')
            str.push(c)
            groupCounter = 1
        }

    })

    return str.reverse().join('')
};


/** @param {NS} ns */
export async function main(ns) {
    const money = 2403891773
    const str = humanReadableMoney({ money, ns })
    ns.tprint(`humanReadableMoney: ${money} vs ${str}`)
}