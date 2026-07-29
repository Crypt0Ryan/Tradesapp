import type { Job } from '../../models/Job';
import { MaterialsPanel } from '../materials/MaterialsPanel';
import { TravelPanel } from '../travel/TravelPanel';

export function JobDetail({ job, clientName, onClose }: { job: Job; clientName: string; onClose: () => void }) {
  return (
    <section>
      <h3>
        {job.title} — {clientName}
      </h3>
      <button type="button" onClick={onClose}>
        Close
      </button>

      <MaterialsPanel jobId={job.id} />
      <TravelPanel jobId={job.id} />
    </section>
  );
}
