import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SubJob } from '../models/SubJob';

// Radix Select can't use an empty string as an item value, so "no sub-job" gets a sentinel.
const NONE = '__none__';

/** Picks which sub-job (section) of a job something belongs to. Renders nothing until the job has sub-jobs. */
export function SubJobSelect({
  subJobs,
  value,
  onChange,
  className,
}: {
  subJobs: SubJob[] | undefined;
  value: string | null | undefined;
  onChange: (subJobId: string | null) => void;
  className?: string;
}) {
  if (!subJobs || subJobs.length === 0) return null;

  return (
    <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger className={className ?? 'w-40'} aria-label="Sub-job">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>General</SelectItem>
        {subJobs.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
