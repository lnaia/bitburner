// import type {NS} from './NetscriptDefinitions';

// export const hackingManager = (ns: NS, targetHost) => {
//   const SCRIPTS = (() => {
//     const hackScript = 'hack-spec.js';
//     const growScript = 'grow-spec.js';
//     const weakenScript = 'weaken-spec.js';

//     [hackScript, growScript, weakenScript].forEach(script => {
//       if (!ns.fileExists(script)) {
//         ns.tprint('missing hacking script');
//         ns.exit();
//       }
//     });

//     return {
//       HACK: {
//         script: hackScript,
//         ram: ns.getScriptRam(hackScript),
//       },
//       GROW: {
//         script: hackScript,
//         ram: ns.getScriptRam(growScript),
//       },
//       WEAKEN: {
//         script: weakenScript,
//         ram: ns.getScriptRam(weakenScript),
//       },
//     };
//   })();

//   const servers = ns
//     .getPurchasedServers()
//     .map(server => ({
//       host: server,
//       ram: ns.getServerMaxRam(server),
//     }))
//     .sort((a, b) => b.ram - a.ram);

//   const securityThreshold = 5;
//   const minSecurity =
//     ns.getServerMinSecurityLevel(targetHost) + securityThreshold;

//   while (true) {
//     const curSecurity = ns.getServerSecurityLevel(targetHost);
//     if (curSecurity > minSecurity) {
//       ns.getWeakenTime(targetHost);
//       ns.weakenAnalyze(1);
//     }
//   }

//   // one manager per target?

//   // quantity ns.getServerGrowth()
//   // time ns.getGrowTime()
//   // x = quantity left to 100
//   // threads to grow to 100: (x / ns.getServerGrowth())
//   //  threads * ns.getGrowTime() = how long it will take to reach 100
//   //
//   //   ns.formulas.hacking.growTime(ns.formulas.mockPerson())
//   for (const server of servers) {
//     const threadsAvailable = server.ram / hackingScriptRam;
//   }
// };
