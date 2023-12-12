// eslint-ignore-next-line node/no-unpublished-import
import {it, describe, expect, jest} from '@jest/globals';
import {buyNode, upgradeNodes} from '../lib-shop-nodes';

describe('lib', () => {
  const ns = {
    getServerMoneyAvailable: jest.fn(),
    purchaseServer: jest.fn(),
    getServerMaxRam: jest.fn(),
    hacknet: {
      purchaseNode: jest.fn(),
      getCoreUpgradeCost: jest.fn(),
      getPurchaseNodeCost: jest.fn(),
      getRamUpgradeCost: jest.fn(),
      upgradeRam: jest.fn(),
      upgradeCore: jest.fn(),
      upgradeLevel: jest.fn(),
    },
  };

  describe('buyNode', () => {
    it('fails to buy due to funds', () => {
      ns.hacknet.getPurchaseNodeCost.mockReturnValue(2);
      ns.getServerMoneyAvailable.mockReturnValue(1);
      // @ts-expect-error ns type
      expect(buyNode(ns)).toEqual([false, 'buyNode: failed, not enough funds']);
      expect(ns.hacknet.getPurchaseNodeCost).toHaveBeenCalled();
      expect(ns.getServerMoneyAvailable).toHaveBeenCalledWith('home');
    });
    it('buys node', () => {
      ns.hacknet.getPurchaseNodeCost.mockReturnValue(1);
      ns.getServerMoneyAvailable.mockReturnValue(1);
      // @ts-expect-error ns type
      expect(buyNode(ns)).toEqual([true, 'buyNode: success']);
    });
  });
});
