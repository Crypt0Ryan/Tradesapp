import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';

export function JobSummary({ jobId }: { jobId: string }) {
  const timeEntries = useLiveQuery(() => db.timeEntries.where('job_id').equals(jobId).toArray(), [jobId]);
  const materialEntries = useLiveQuery(() => db.materialEntries.where('job_id').equals(jobId).toArray(), [jobId]);
  const travelEntries = useLiveQuery(() => db.travelEntries.where('job_id').equals(jobId).toArray(), [jobId]);

  const totalHours = (timeEntries?.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0) ?? 0) / 60;
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
