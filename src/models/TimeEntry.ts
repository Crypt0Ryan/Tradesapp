export type TimeEntrySource = 'manual' | 'timer' | 'voice';

export interface TimeEntry {
  id: string;
  job_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  billable: boolean;
  source: TimeEntrySource;
  notes: string;
}

export type NewTimeEntry = Omit<TimeEntry, 'id'>;
