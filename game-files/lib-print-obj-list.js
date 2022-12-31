/** @param {NS} ns */

const genStr = (max, char = ' ', curr = 0) => {
    if (curr === max) {
        return char;
    }

    return char + genStr(max, char, curr + 1)
}

const longestStr = (list) => list.reduce((acc, str) => {
    if (str.length > acc[1]) {
        return [str, str.length]
    } else {
        return acc
    }
}, ['', 0]);

const rightPad = (str, len) => {
    if (str.length > len) {
        const arr = str.split('');
        arr.splice(0, len)
        return arr;
    } else if (str.length === len) {
        return str;
    }

    const whiteSpaceCount = len - str.length;
    
    return `${str}${genStr(whiteSpaceCount)}`
}

export const printObjList = (list, print) => {
    const forceString = (val) => {
        if (typeof val !== 'string') {
            try {
                return val.toString();
            } catch (e) {
                print('toString failed on type:', typeof val, ' with ', e)
                return `${val}`
            }
        }
        return val;
    }

    const headers = Object.keys(list[0]);    
    const longestHeader = longestStr(headers)    
    const longestValue = list.reduce((acc, obj) => {
        const longestVals = Object.values(obj).map(forceString).sort((a, b) => b.length - a.length)
        if (longestVals[0].length > acc[1]) {
            return [
                longestVals[0],
                longestVals[0].length
            ]
        } else {
            return acc
        }

    }, longestHeader)

    const longestColumn = longestHeader[1] > longestValue[1] ? longestHeader : longestValue;

    const headerRow = [];
    headers.forEach((header) => {
        headerRow.push(rightPad(header, longestColumn[1] + 1))
    })

    const rows = [];
    list.forEach((obj) => {
        const objVals = Object.values(obj).map((val) => rightPad(forceString(val), longestColumn[1] + 1))        
        rows.push(objVals.join(''))
    })
    
    print(headerRow.join(''))
    rows.forEach((row) => print(row))  
};

export async function main(ns) {
    //  ns.tprint(genStr(20, 'L'), '-')
    // ns.tprint(rightPad('Luis', 20), '-')

    printObjList([
        {
            hostname: 'this-is-a-long-host',
            currentRam: '32'
        },
        {
            hostname: 'n00dles',
            currentRam: '8'
        }
    ], ns.tprint)
}