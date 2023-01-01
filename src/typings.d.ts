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
