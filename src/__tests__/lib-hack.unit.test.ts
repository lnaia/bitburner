import {describe, expect, it, jest} from '@jest/globals';
import {isCapacityEnough} from '../lib-resource-scheduler ';
import {batchHack} from '../lib-hack';
import type {HackJob} from '../typings';

describe('lib-hack', () => {
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

  describe('batchHack', () => {
    it('sorts and calculates time correctly', () => {
      // const jobs: Job[] = [
      //   {
      //     targetHost: '[targetHost]',
      //     script: '[script]',
      //     threads: 4,
      //     timeToRun: 1,
      //     timeToWait: 0,
      //   },
      // ];
      // // @ts-expect-error wrong ns type
      // const result = batchHack(ns, host);
      // expect(result).toEqual([
      //   {waitTime: 0, runTime: 4, threads: 1, type: 'grow-weaken'},
      //   {waitTime: 1, runTime: 3, threads: 1, type: 'hack-weaken'},
      //   {waitTime: 2, runTime: 2, threads: 1, type: 'grow'},
      //   {waitTime: 3, runTime: 1, threads: 1, type: 'hack'},
      // ]);
    });
  });
});
