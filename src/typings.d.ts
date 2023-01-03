import type {NS} from './NetscriptDefinitions';
export interface HostDetails {
  mm: number;
  hmm: string;
  cm: number;
  hcm: string;
  host: string;
  '% diff': string;
  rh: number;
  ms: number;
  cs: number;
  ht: number;
}

export type StatusReport = [boolean, string?];

export type AllocatedResources = [{[key: string]: number}, number];

export type ActionMap = {
  [key: string]: {
    stopCondition: (ns: NS, str: string) => boolean;
    calculateThreads: (ns: NS, str: string) => number;
  };
};
