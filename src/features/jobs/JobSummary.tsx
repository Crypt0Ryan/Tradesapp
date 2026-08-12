import { useLiveQuery } from 'dexie-react-hooks';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { db } from '../../db/database';
import { getBusinessSettings } from '../../lib/businessSettings';
import { computeJobActualCost } from '../../lib/jobCosting';
import { formatCurrency } from '../../lib/currency';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Job } from '../../models/Job';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function JobSummary({ job }: { job: Job }) {
  const jobId = job.id;
  const timeEntries = useLiveQuery(() => db.timeEntries.where('job_id').equals(jobId).toArray(), [jobId]);
  const materialEntries = useLiveQuery(() => db.materialEntries.where('job_id').equals(jobId).toArray(), [jobId]);
  const travelEntries = useLiveQuery(() => db.travelEntries.where('job_id').equals(jobId).toArray(), [jobId]);
  const contractorLogs = useLiveQuery(() => db.contractorLogs.where('job_id').equals(jobId).toArray(), [jobId]);
  const kmRate = getBusinessSettings().kmRate;

  const totalHours = (timeEntries?.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0) ?? 0) / 60;
  const totalKm = travelEntries?.reduce((sum, e) => sum + e.distance_km, 0) ?? 0;

  const { labourCost, contractorCost, materialsCost, travelCost, gst, totalIncGst } = computeJobActualCost(
    job,
    timeEntries ?? [],
    materialEntries ?? [],
    travelEntries ?? [],
    contractorLogs ?? [],
    kmRate,
  );

  const variance = job.quoted_amount !== null ? job.quoted_amount - totalIncGst : null;
  const isOverQuote = variance !== null && variance < 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Hours" value={totalHours.toFixed(2)} />
          <Stat
            label="Labour"
            value={job.hourly_rate ? formatCurrency(labourCost) : '—'}
            hint={job.hourly_rate ? 'ex GST' : 'set hourly rate'}
          />
          <Stat label="Materials" value={formatCurrency(materialsCost)} hint="ex GST" />
          <Stat
            label="Travel"
            value={`${totalKm} km`}
            hint={kmRate ? `${formatCurrency(travelCost)} ex GST` : 'set $/km rate to cost this'}
          />
          <Stat
            label="Contractors"
            value={contractorCost > 0 ? formatCurrency(contractorCost) : '—'}
            hint={contractorLogs && contractorLogs.length > 0 ? `${contractorLogs.length} on site` : undefined}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">
            GST <span className="font-medium text-foreground">{formatCurrency(gst)}</span>
          </span>
          <span className="text-muted-foreground">
            Actual total <span className="font-semibold text-foreground">{formatCurrency(totalIncGst)}</span>
          </span>
          <span className="text-muted-foreground">
            Quoted{' '}
            <span className="font-medium text-foreground">
              {job.quoted_amount !== null ? formatCurrency(job.quoted_amount) : 'not set'}
            </span>
          </span>
          {variance !== null && (
            <span
              className={cn(
                'ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 font-medium',
                isOverQuote ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success',
              )}
            >
              {isOverQuote ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
              {variance >= 0 ? '+' : ''}
              {formatCurrency(variance)} {isOverQuote ? 'over quote' : 'under quote'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
