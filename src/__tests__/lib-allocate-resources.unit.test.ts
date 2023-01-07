import {describe, expect, it, jest} from '@jest/globals';
import {availableResources, allocateResources} from '../lib-allocate-resources';
import * as discoverHostsLib from '../lib-discover-hosts';

describe('lib-allocate-resources', () => {
  const script = '[script]';
  const scriptRam = 4;
  const ns = {
    fileExists: jest.fn(),
    hasRootAccess: jest.fn(),
    getPurchasedServers: jest.fn(),
    print: jest.fn(),
    exit: jest.fn(),
    getServerMaxRam: jest.fn(),
    getServerUsedRam: jest.fn(),
  };

  describe('availableResources', () => {
    it('stop running if script does not exist', () => {
      ns.fileExists.mockReturnValue(false);

      // @ts-expect-error wrong ns type
      const result = availableResources(ns, script, scriptRam);

      expect(ns.fileExists).toHaveBeenCalledWith(script);
      expect(result).toEqual([]);
    });

    it('returns correct set of hosts', () => {
      jest
        .spyOn(discoverHostsLib, 'discoverHosts')
        .mockReturnValue([
          'server-yes-root-1',
          'server-no-root-1',
          'server-yes-root-2',
        ]);
      ns.getServerMaxRam.mockReturnValue(8);
      ns.getServerUsedRam.mockReturnValue(2);
      ns.fileExists.mockReturnValue(true);
      ns.hasRootAccess
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      ns.getPurchasedServers.mockReturnValue(['own-host-1', 'own-host-2']);

      // @ts-expect-error wrong ns type
      const resources = availableResources(ns, script, scriptRam);

      expect(ns.getPurchasedServers).toHaveBeenCalled();
      expect(ns.getServerMaxRam).toHaveBeenCalled();
      expect(ns.getServerUsedRam).toHaveBeenCalled();
      expect(resources).toEqual({
        'own-host-1': 1,
        'own-host-2': 1,
        'server-yes-root-1': 1,
        'server-yes-root-2': 1,
      });
    });

    it('includes home as an available host', () => {
      jest
        .spyOn(discoverHostsLib, 'discoverHosts')
        .mockReturnValue([
          'server-yes-root-1',
          'server-no-root-1',
          'server-yes-root-2',
        ]);
      ns.getServerMaxRam.mockReturnValue(8);
      ns.getServerUsedRam.mockReturnValue(2);
      ns.fileExists.mockReturnValue(true);
      ns.hasRootAccess
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      ns.getPurchasedServers.mockReturnValue(['own-host-1', 'own-host-2']);

      // @ts-expect-error wrong ns type
      const resources = availableResources(ns, script, scriptRam, true);

      expect(resources).toEqual({
        home: 1,
        'own-host-1': 1,
        'own-host-2': 1,
        'server-yes-root-1': 1,
        'server-yes-root-2': 1,
      });
    });
  });

  describe('allocateResources', () => {
    it('returns expected resources', () => {
      jest.spyOn(discoverHostsLib, 'discoverHosts').mockReturnValue(['a', 'b']);
      ns.getPurchasedServers.mockReturnValue(['c']);
      ns.getServerMaxRam
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(8)
        .mockReturnValueOnce(28);

      ns.getServerUsedRam.mockReturnValue(0);
      ns.fileExists.mockReturnValue(true);
      ns.hasRootAccess.mockReturnValue(true);

      // @ts-expect-error ns type miss match
      expect(allocateResources(ns, script, scriptRam, 10)).toEqual([
        {
          a: 1,
          b: 2,
          c: 7,
        },
        10,
      ]);
    });

    it('returns expected resources including home', () => {
      jest.spyOn(discoverHostsLib, 'discoverHosts').mockReturnValue(['a', 'b']);
      ns.getPurchasedServers.mockReturnValue(['c']);
      ns.getServerMaxRam
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(8)
        .mockReturnValueOnce(28)
        .mockReturnValueOnce(4);

      ns.getServerUsedRam.mockReturnValue(0);
      ns.fileExists.mockReturnValue(true);
      ns.hasRootAccess.mockReturnValue(true);

      // @ts-expect-error ns type miss match
      expect(allocateResources(ns, script, scriptRam, 11, true)).toEqual([
        {
          a: 1,
          b: 2,
          c: 7,
          home: 1,
        },
        11,
      ]);
    });

    it('requests more threads than those available', () => {
      jest.spyOn(discoverHostsLib, 'discoverHosts').mockReturnValue(['a', 'b']);
      ns.getPurchasedServers.mockReturnValue(['c']);
      ns.getServerMaxRam.mockReturnValueOnce(4).mockReturnValueOnce(4);

      ns.getServerUsedRam.mockReturnValue(0);
      ns.fileExists.mockReturnValue(true);
      ns.hasRootAccess.mockReturnValue(true);

      // @ts-expect-error ns type miss match
      expect(allocateResources(ns, script, scriptRam, 100, true)).toEqual([
        {
          a: 1,
          b: 1,
        },
        2,
      ]);
    });

    it('requests no threads', () => {
      jest.spyOn(discoverHostsLib, 'discoverHosts').mockReturnValue(['a', 'b']);
      ns.getPurchasedServers.mockReturnValue(['c']);
      ns.getServerMaxRam
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(8)
        .mockReturnValueOnce(28)
        .mockReturnValueOnce(4);

      ns.getServerUsedRam.mockReturnValue(0);
      ns.fileExists.mockReturnValue(true);
      ns.hasRootAccess.mockReturnValue(true);

      // @ts-expect-error ns type miss match
      expect(allocateResources(ns, script, scriptRam, 0, true)).toEqual([
        {},
        0,
      ]);
    });
  });
});
