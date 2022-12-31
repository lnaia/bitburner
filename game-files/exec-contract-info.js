import { printObjList } from './lib-print-obj-list';

/** @param {NS} ns */
export async function main(ns) {
    const [host, contract] = ns.args
    if (!host || !contract) {
        ns.tprint('missing host and contract - nothing to do')
        ns.exit()
    }

    const desc = ns.codingcontract.getDescription(contract, host)
    const attempts = ns.codingcontract.getNumTriesRemaining(contract, host)
    const data = ns.codingcontract.getData(contract, host)
    const type = ns.codingcontract.getContractType(contract, host)
    const details = {
        host,
        contract,
        type,
        attempts,
        data
    }
    
    printObjList([details], ns.tprint)
    ns.tprint(desc)
}