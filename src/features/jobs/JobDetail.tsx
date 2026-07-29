import type { Job } from '../../models/Job';
import { JobSummary } from './JobSummary';
import { TimePanel } from '../time/TimePanel';
import { MaterialsPanel } from '../materials/MaterialsPanel';
import { TravelPanel } from '../travel/TravelPanel';
import { PhotosPanel } from '../photos/PhotosPanel';

export function JobDetail({ job, clientName, onClose }: { job: Job; clientName: string; onClose: () => void }) {
  return (
    <section>
      <h3>
        {job.title} — {clientName}
      </h3>
      <button type="button" onClick={onClose}>
        Close
      </button>

      <JobSummary job={job} />
      <TimePanel job={job} />
      <MaterialsPanel jobId={job.id} />
      <TravelPanel jobId={job.id} />
      <PhotosPanel jobId={job.id} />
    </section>
  );
}
