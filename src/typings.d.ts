export interface HostDetails {
  mm: number;
  hmm: string;
  cm: number;
  hcm: string;
  host: string;
  diff: string;
  rh: number;
  ms: number;
  cs: string;
  hc: number;
}
export type StatusReport = [boolean, string?];

export type AllocatedResources = [{ [key: string]: number }, number];

export type CalculateActionTime = (host: string) => number;

export type Job = {
  targetHost: string;
  script: string;
  threads: number;
  timeToWait: number;
  timeToRun: number;
};

export type HackJob = {
  runTime: number;
  waitTime: number;
  threads: number;
  type: string;
};
