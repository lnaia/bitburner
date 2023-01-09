import type {NS} from './NetscriptDefinitions';
export interface HostDetails {
  mm: number;
  hmm: string;
  cm: number;
  hcm: string;
  host: string;
  diff: string;
  rh: number;
  ms: number;
  cs: number;
  hc: number;
}
export type StatusReport = [boolean, string?];

export type AllocatedResources = [{[key: string]: number}, number];

export type CalculateActionTime = (host: string) => number;

export type ActionMap = {
  [key: string]: {
    script: string;
    stopCondition: (ns: NS, str: string) => boolean;
    calculateThreads: (ns: NS, str: string) => number;
    calculateActionTime: CalculateActionTime;
  };
};

export type Job = {
  targetHost: string;
  script: string;
  threads: number;
  duration?: number;
};
