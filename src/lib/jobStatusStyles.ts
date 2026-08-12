import type { JobStatus } from '../models/Job';

/** Tailwind classes per job status, used anywhere a status badge is shown. */
export const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  quoted: 'bg-muted text-muted-foreground',
  active: 'bg-accent/15 text-accent',
  paused: 'bg-secondary/15 text-secondary',
  complete: 'bg-success/15 text-success',
  invoiced: 'bg-primary/10 text-primary',
};
