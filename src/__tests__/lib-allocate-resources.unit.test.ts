import {describe, expect, it, jest} from '@jest/globals';
import {availableResources} from '../lib-allocate-resources';
import * as discoverHostsLib from '../lib-discover-hosts';

describe('lib-allocate-resources', () => {
  describe('availableResources', () => {
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
});
