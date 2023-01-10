import {describe, expect, it, jest} from '@jest/globals';
import {isCapacityEnough} from '../lib-resource-scheduler ';
import * as discoverHostsLib from '../lib-discover-hosts';
import type {Job} from '../typings';

describe('lib-resource-scheduler', () => {
  const ns = {
    write: jest.fn(),
    exec: jest.fn(),
    rm: jest.fn(),
    disableLog: jest.fn(),
    fileExists: jest.fn(),
    hasRootAccess: jest.fn(),
    getPurchasedServers: jest.fn(),
    print: jest.fn(),
    tprint: jest.fn(),
    exit: jest.fn(),
    getServerMaxRam: jest.fn(),
    getServerUsedRam: jest.fn(),
    getScriptRam: jest.fn(),
  };

  describe('isCapacityEnough', () => {
    it('capacity is enough for a simple job', () => {
      jest.spyOn(discoverHostsLib, 'discoverHosts').mockReturnValue([]);
      ns.getServerMaxRam.mockReturnValue(4);
      ns.getServerUsedRam.mockReturnValue(0);
      ns.hasRootAccess.mockReturnValue(true);
      ns.getPurchasedServers.mockReturnValue(['a', 'b']);
      ns.getScriptRam.mockReturnValue(2);

      const jobs: Job[] = [
        {
          targetHost: '[targetHost]',
          script: '[script]',
          threads: 4,
          timeToRun: 1,
          timeToWait: 0,
        },
      ];

      // @ts-expect-error wrong ns type
      const result = isCapacityEnough(ns, jobs);
      expect(result).toEqual([true, [{a: 2, b: 2}]]);
    });

    it('capacity is NOT enough for a simple job', () => {
      jest.spyOn(discoverHostsLib, 'discoverHosts').mockReturnValue([]);
      ns.getServerMaxRam.mockReturnValue(4);
      ns.getServerUsedRam.mockReturnValue(0);
      ns.hasRootAccess.mockReturnValue(true);
      ns.getPurchasedServers.mockReturnValue(['a', 'b']);
      ns.getScriptRam.mockReturnValue(2);

      const jobs: Job[] = [
        {
          targetHost: '[targetHost]',
          script: '[script]',
          threads: 5,
          timeToRun: 1,
          timeToWait: 0,
        },
      ];

      // @ts-expect-error wrong ns type
      const result = isCapacityEnough(ns, jobs);
      expect(result).toEqual([false, null]);
    });

    it('capacity is way more than enough for a simple job', () => {
      jest.spyOn(discoverHostsLib, 'discoverHosts').mockReturnValue([]);
      ns.getServerMaxRam.mockReturnValue(10);
      ns.getServerUsedRam.mockReturnValue(0);
      ns.hasRootAccess.mockReturnValue(true);
      ns.getPurchasedServers.mockReturnValue(['a', 'b']);
      ns.getScriptRam.mockReturnValue(1);

      const jobs: Job[] = [
        {
          targetHost: '[targetHost]',
          script: '[script]',
          threads: 4,
          timeToRun: 1,
          timeToWait: 0,
        },
      ];

      // @ts-expect-error wrong ns type
      const result = isCapacityEnough(ns, jobs);
      expect(result).toEqual([true, [{a: 4}]]);
    });

    it('capacity is enough for a complex job', () => {
      jest.spyOn(discoverHostsLib, 'discoverHosts').mockReturnValue([]);
      ns.getServerMaxRam.mockReturnValue(10);
      ns.getServerUsedRam.mockReturnValue(0);
      ns.hasRootAccess.mockReturnValue(true);
      ns.getPurchasedServers.mockReturnValue(['a', 'b']);
      ns.getScriptRam.mockReturnValue(1);

      const jobs: Job[] = [
        {
          targetHost: '[th1]',
          script: '[s1]',
          threads: 5,
          timeToRun: 1,
          timeToWait: 0,
        },
        {
          targetHost: '[th2]',
          script: '[s1]',
          threads: 2,
          timeToRun: 1,
          timeToWait: 0,
        },
        {
          targetHost: '[th3]',
          script: '[s1]',
          threads: 3,
          timeToRun: 1,
          timeToWait: 0,
        },
        {
          targetHost: '[th4]',
          script: '[s1]',
          threads: 5,
          timeToRun: 1,
          timeToWait: 0,
        },
        {
          targetHost: '[th5]',
          script: '[s1]',
          threads: 5,
          timeToRun: 1,
          timeToWait: 0,
        },
      ];

      // @ts-expect-error wrong ns type
      const result = isCapacityEnough(ns, jobs);
      expect(result).toEqual([true, [{a: 5}, {a: 2}, {a: 3}, {b: 5}, {b: 5}]]);
    });
  });
});
