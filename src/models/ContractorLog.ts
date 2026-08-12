export type ContractorRole = 'subcontractor' | 'apprentice' | 'other';

export interface ContractorLog {
  id: string;
  job_id: string;
  name: string;
  role: ContractorRole;
  date: string;
  hours: number | null;
  hourly_rate: number | null;
  notes: string;
}

export type NewContractorLog = Omit<ContractorLog, 'id'>;
