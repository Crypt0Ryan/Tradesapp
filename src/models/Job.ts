export type JobStatus = 'quoted' | 'active' | 'paused' | 'complete' | 'invoiced';

export interface Job {
  id: string;
  client_id: string;
  title: string;
  status: JobStatus;
  quoted_amount: number | null;
  start_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type NewJob = Omit<Job, 'id' | 'created_at' | 'updated_at'>;
