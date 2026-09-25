export type JobStatus = 'quoted' | 'active' | 'paused' | 'complete' | 'invoiced';

/** Per-job invoice edits (all optional - the invoice works with none of them set). */
export interface InvoiceSettings {
  /** Overrides the auto-generated invoice number. */
  number?: string;
  /** YYYY-MM-DD; defaults to today when unset. */
  date?: string;
  /** YYYY-MM-DD; overrides the due date computed from the business's payment terms. */
  due_date?: string;
  /** Free-text description of works / notes, printed on the invoice. */
  notes?: string;
  /** Itemise labour entry-by-entry (default) rather than one summary line per section. */
  detailed?: boolean;
}

export interface Job {
  id: string;
  client_id: string;
  title: string;
  status: JobStatus;
  quoted_amount: number | null;
  hourly_rate: number | null;
  start_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
  invoice?: InvoiceSettings;
}

export type NewJob = Omit<Job, 'id' | 'created_at' | 'updated_at'>;
