import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { getBusinessSettings } from '../../lib/businessSettings';
import { computeJobActualCost } from '../../lib/jobCosting';
import { formatCurrency } from '../../lib/currency';
import type { Job } from '../../models/Job';

export function JobSummary({ job }: { job: Job }) {
  const jobId = job.id;
  const timeEntries = useLiveQuery(() => db.timeEntries.where('job_id').equals(jobId).toArray(), [jobId]);
  const materialEntries = useLiveQuery(() => db.materialEntries.where('job_id').equals(jobId).toArray(), [jobId]);
  const travelEntries = useLiveQuery(() => db.travelEntries.where('job_id').equals(jobId).toArray(), [jobId]);
  const kmRate = getBusinessSettings().kmRate;

  const totalHours = (timeEntries?.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0) ?? 0) / 60;
  const totalKm = travelEntries?.reduce((sum, e) => sum + e.distance_km, 0) ?? 0;

  const { labourCost, materialsCost, travelCost, gst, totalIncGst } = computeJobActualCost(
    job,
    timeEntries ?? [],
    materialEntries ?? [],
    travelEntries ?? [],
    kmRate,
  );

  const variance = job.quoted_amount !== null ? job.quoted_amount - totalIncGst : null;

  return (
    <table>
      <tbody>
        <tr>
          <td>Hours</td>
          <td>{totalHours.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Labour (ex GST)</td>
          <td>{job.hourly_rate ? `$${labourCost.toFixed(2)}` : '— (set hourly rate)'}</td>
        </tr>
        <tr>
          <td>Materials (ex GST)</td>
          <td>${materialsCost.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Travel</td>
          <td>
            {totalKm} km{kmRate ? ` — $${travelCost.toFixed(2)}` : ' (set $/km rate to cost this)'}
          </td>
        </tr>
        <tr>
          <td>GST (10%)</td>
          <td>${gst.toFixed(2)}</td>
        </tr>
        <tr>
          <td>
            <strong>Actual total (inc GST)</strong>
          </td>
          <td>
            <strong>${totalIncGst.toFixed(2)}</strong>
          </td>
        </tr>
        <tr>
          <td>Quoted</td>
          <td>{job.quoted_amount !== null ? `$${job.quoted_amount.toFixed(2)}` : '— not set'}</td>
        </tr>
        {variance !== null && (
          <tr>
            <td>Variance</td>
            <td style={{ color: variance < 0 ? '#c0392b' : undefined }}>
              {variance >= 0 ? '+' : ''}
              {formatCurrency(variance)} {variance < 0 ? '(over quote)' : '(under quote)'}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
