import {describe, expect, it, jest} from '@jest/globals';
import {availableResources, allocateResources} from '../lib-resources';
import * as discoverHostsLib from '../lib-discover-hosts';

describe('lib-allocate-resources', () => {
  const script = '[script]';
  const scriptRam = 4;
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
  };

  describe('availableResources', () => {
    it('returns correct set of hosts', () => {
      jest
        .spyOn(discoverHostsLib, 'discoverHosts')
        .mockReturnValue(['server-root-1', 'server-root-2']);
      ns.getServerMaxRam.mockReturnValue(8);
      ns.getServerUsedRam.mockReturnValue(2);
      ns.fileExists.mockReturnValue(true);
      ns.hasRootAccess.mockReturnValueOnce(true).mockReturnValueOnce(true);
      ns.getPurchasedServers.mockReturnValue(['own-host-1', 'own-host-2']);

      // @ts-expect-error wrong ns type
      const resources = availableResources(ns);

      expect(ns.getPurchasedServers).toHaveBeenCalled();
      expect(ns.getServerMaxRam).toHaveBeenCalled();
      expect(ns.getServerUsedRam).toHaveBeenCalled();
      expect(resources).toEqual({
        'own-host-1': 6,
        'own-host-2': 6,
        'server-root-1': 6,
        'server-root-2': 6,
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
      const resources = availableResources(ns, true);

      expect(resources).toEqual({
        'own-host-1': 6,
        'own-host-2': 6,
        'server-yes-root-1': 6,
        'server-yes-root-2': 6,
        home: 6,
      });
    });
  });

  describe('allocateResources', () => {
    it('returns empty resource - lock is active', async () => {
      ns.fileExists.mockReturnValue(true);
      // @ts-expect-error ns type miss match
      const result = await allocateResources(ns, [scriptRam, 10]);
      expect(result).toEqual([[{}, 0]]);
    });

    it('exists abruptly - unable to get a lock', async () => {
      ns.fileExists.mockReturnValueOnce(false).mockReturnValueOnce(true);
      ns.exit.mockImplementation(() => {
        return undefined;
      });
      // @ts-expect-error ns type miss match
      const result = await allocateResources(ns, [scriptRam, 10]);
      expect(result).toBeUndefined();
      expect(ns.exit).toHaveBeenCalled();
    });

    it('returns expected resources', async () => {
      ns.fileExists.mockReturnValue(false);
      jest.spyOn(discoverHostsLib, 'discoverHosts').mockReturnValue(['a']);
      ns.getPurchasedServers.mockReturnValue(['b']);
      ns.getServerMaxRam.mockReturnValueOnce(4).mockReturnValueOnce(1);
      ns.getServerUsedRam.mockReturnValue(0);
      ns.hasRootAccess.mockReturnValue(true);

      // @ts-expect-error ns type miss match
      const result = await allocateResources(ns, [
        [4, 10],
        [1, 1000],
      ]);
      expect(result).toEqual([
        [{a: 1}, 1],
        [{b: 1}, 1],
      ]);
      expect(ns.exec).toHaveBeenCalledWith('exec-unlock-resources', 'home');
    });

    it.only('returns expected resources including home', async () => {
      ns.fileExists.mockReturnValue(false);
      jest
        .spyOn(discoverHostsLib, 'discoverHosts')
        .mockReturnValue(['a', 'home']);
      ns.getPurchasedServers.mockReturnValue(['b']);
      ns.getServerMaxRam
        .mockReturnValueOnce(4)
        .mockReturnValueOnce(5)
        .mockReturnValueOnce(1);
      ns.getServerUsedRam.mockReturnValue(0);
      ns.hasRootAccess.mockReturnValue(true);

      const result = await allocateResources(
        // @ts-expect-error ns type miss match
        ns,
        [
          [4, 10],
          [1, 1000],
        ],
        true
      );
      expect(result).toEqual([
        [{a: 1, home: 1}, 2],
        [{b: 1, home: 1}, 2],
      ]);
      expect(ns.exec).toHaveBeenCalledWith('exec-unlock-resources', 'home');
    });

    //   it('requests more threads than those available', async () => {
    //     ns.fileExists.mockReturnValue(false);
    //     jest.spyOn(discoverHostsLib, 'discoverHosts').mockReturnValue(['a', 'b']);
    //     ns.getPurchasedServers.mockReturnValue(['c']);
    //     ns.getServerMaxRam.mockReturnValueOnce(4).mockReturnValueOnce(4);

    //     ns.getServerUsedRam.mockReturnValue(0);
    //     ns.hasRootAccess.mockReturnValue(true);

    //     // @ts-expect-error ns type miss match
    //     expect(await allocateResources(ns, [[scriptRam, 100]], true)).toEqual([
    //       {
    //         a: 1,
    //         b: 1,
    //       },
    //       2,
    //     ]);
    //   });

    //   it('requests no threads', async () => {
    //     ns.fileExists.mockReturnValue(false);

    //     jest.spyOn(discoverHostsLib, 'discoverHosts').mockReturnValue(['a', 'b']);
    //     ns.getPurchasedServers.mockReturnValue(['c']);
    //     ns.getServerMaxRam
    //       .mockReturnValueOnce(4)
    //       .mockReturnValueOnce(8)
    //       .mockReturnValueOnce(28)
    //       .mockReturnValueOnce(4);

    //     ns.getServerUsedRam.mockReturnValue(0);
    //     ns.hasRootAccess.mockReturnValue(true);

    //     // @ts-expect-error ns type miss match
    //     expect(await allocateResources(ns, [[scriptRam, 0]], true)).toEqual([
    //       {},
    //       0,
    //     ]);
    //   });
  });
});
