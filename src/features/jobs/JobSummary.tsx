import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import type { Job } from '../../models/Job';

export function JobSummary({ job }: { job: Job }) {
  const jobId = job.id;
  const timeEntries = useLiveQuery(() => db.timeEntries.where('job_id').equals(jobId).toArray(), [jobId]);
  const materialEntries = useLiveQuery(() => db.materialEntries.where('job_id').equals(jobId).toArray(), [jobId]);
  const travelEntries = useLiveQuery(() => db.travelEntries.where('job_id').equals(jobId).toArray(), [jobId]);

  const totalHours = (timeEntries?.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0) ?? 0) / 60;
  const billableMinutes = timeEntries?.reduce((sum, e) => sum + (e.billable ? (e.duration_minutes ?? 0) : 0), 0) ?? 0;
  const labourCost = job.hourly_rate ? (billableMinutes / 60) * job.hourly_rate : null;
  const materialsCost =
    materialEntries?.reduce((sum, e) => sum + e.quantity * e.unit_cost * (1 + e.markup_pct / 100), 0) ?? 0;
  const totalKm = travelEntries?.reduce((sum, e) => sum + e.distance_km, 0) ?? 0;

  return (
    <table>
      <tbody>
        <tr>
          <td>Hours</td>
          <td>{totalHours.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Labour</td>
          <td>{labourCost !== null ? `$${labourCost.toFixed(2)}` : '— (set hourly rate)'}</td>
        </tr>
        <tr>
          <td>Materials</td>
          <td>${materialsCost.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Travel</td>
          <td>{totalKm} km</td>
        </tr>
      </tbody>
    </table>
  );
}
