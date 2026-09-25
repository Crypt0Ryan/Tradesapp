/**
 * A named section within a job (e.g. "Bathroom", "Kitchen") so time and
 * materials can be grouped and invoiced separately under one job.
 */
export interface SubJob {
  id: string;
  job_id: string;
  name: string;
  created_at: string;
}

export type NewSubJob = Omit<SubJob, 'id' | 'created_at'>;
