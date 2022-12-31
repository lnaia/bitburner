import { it, describe, expect, test, beforeEach, jest } from '@jest/globals';
import * as lib from '../lib';

describe('lib', () => {
    const ns = {
        getPurchasedServers: jest.fn(),
        getPurchasedServerLimit: jest.fn(),
        getPurchasedServerCost: jest.fn(),
        getServerMoneyAvailable: jest.fn(),
        purchaseServer: jest.fn(),
        getServerMaxRam: jest.fn(),
        getPurchasedServerUpgradeCost: jest.fn(),
        upgradePurchasedServer: jest.fn(),
        hacknet: {
            purchaseNode: jest.fn(),
            getCoreUpgradeCost: jest.fn(),
            getPurchaseNodeCost: jest.fn(),
            getRamUpgradeCost: jest.fn(),
            upgradeRam: jest.fn(),
            upgradeCore: jest.fn(),
            upgradeLevel: jest.fn(),

        }
    };

    describe('buyServer', () => {
        const { buyServer } = lib;
        it('fails to buy the server due to limits reached', () => {
            ns.getPurchasedServers.mockReturnValue(['foo'])
            ns.getPurchasedServerLimit.mockReturnValue(1)
            // @ts-expect-error wrong type
            expect(buyServer(ns)).toEqual([
                false,
                'buyServer: failed, purchase limit reached'
            ])
            expect(ns.getPurchasedServers).toHaveBeenCalled()
            expect(ns.getPurchasedServerLimit).toHaveBeenCalled()
        })

        it('fails to buy the server due to lack of funds', () => {
            ns.getPurchasedServers.mockReturnValue(['foo'])
            ns.getPurchasedServerLimit.mockReturnValue(2)
            ns.getServerMoneyAvailable.mockReturnValue(0)
            ns.getPurchasedServerCost.mockReturnValue(1)
            // @ts-expect-error wrong type
            expect(buyServer(ns)).toEqual([
                false,
                'buyServer: failed, not enough funds'
            ])
            expect(ns.getPurchasedServerCost).toHaveBeenCalledWith(2)
            expect(ns.getServerMoneyAvailable).toHaveBeenCalledWith('home')
        })
        it('fails to buy the server', () => {
            ns.getPurchasedServers.mockReturnValue(['foo'])
            ns.getPurchasedServerLimit.mockReturnValue(2)
            ns.getServerMoneyAvailable.mockReturnValue(2)
            ns.getPurchasedServerCost.mockReturnValue(1)
            ns.purchaseServer.mockReturnValue('')
            // @ts-expect-error wrong type
            expect(buyServer(ns)).toEqual([
                false,
                'buyServer: failed'
            ])
            expect(ns.purchaseServer).toHaveBeenCalledWith('remote-server-2', 2)
        })

        it('buys the server', () => {
            ns.getPurchasedServers.mockReturnValue(['foo'])
            ns.getPurchasedServerLimit.mockReturnValue(2)
            ns.getServerMoneyAvailable.mockReturnValue(2)
            ns.getPurchasedServerCost.mockReturnValue(1)
            ns.purchaseServer.mockReturnValue('remote-server-2')
            // @ts-expect-error wrong type
            expect(buyServer(ns)).toEqual([
                true,
                'buyServer: success, remote-server-2@2'
            ])
            expect(ns.purchaseServer).toHaveBeenCalledWith('remote-server-2', 2)
        })
    });

    describe('upgradeServer', () => {
        const { upgradeServer } = lib;
        it('fails to upgrade due to funds', () => {
            ns.getServerMaxRam.mockReturnValue(2)
            ns.getPurchasedServerUpgradeCost.mockReturnValue(2)
            ns.getServerMoneyAvailable.mockReturnValue(1)
            // @ts-expect-error ns type
            expect(upgradeServer(ns, 'server')).toEqual([
                false,
                'upgradeServer: failed, server not enough funds'
            ])
            expect(ns.getServerMaxRam).toHaveBeenCalledWith('server')
            expect(ns.getPurchasedServerUpgradeCost).toHaveBeenCalledWith('server', 4)
            expect(ns.getServerMoneyAvailable).toHaveBeenCalledWith('home')
        })

        it('upgrades', () => {
            ns.getServerMaxRam.mockReturnValue(2)
            ns.getPurchasedServerUpgradeCost.mockReturnValue(2)
            ns.getServerMoneyAvailable.mockReturnValue(2)
            // @ts-expect-error ns type
            expect(upgradeServer(ns, 'server')).toEqual([
                true,
                'upgradeServer: success, server upgraded to 4'
            ])
        })
    })

    describe('buyNode', () => {
        const { buyNode } = lib;
        it('fails to buy due to funds', () => {
            ns.hacknet.getPurchaseNodeCost.mockReturnValue(2)
            ns.getServerMoneyAvailable.mockReturnValue(1)
            // @ts-expect-error ns type
            expect(buyNode(ns)).toEqual([
                false,
                'buyNode: failed, not enough funds'
            ])
            expect(ns.hacknet.getPurchaseNodeCost).toHaveBeenCalled()
            expect(ns.getServerMoneyAvailable).toHaveBeenCalledWith('home')
        })
        it('buys node', () => {
            ns.hacknet.getPurchaseNodeCost.mockReturnValue(1)
            ns.getServerMoneyAvailable.mockReturnValue(1)
            // @ts-expect-error ns type
            expect(buyNode(ns)).toEqual([
                true,
                'buyNode: success'
            ])
        })
    })
});

