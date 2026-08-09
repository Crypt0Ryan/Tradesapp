import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { JobDetail } from './JobDetail';
import { VoiceInboxPanel } from '../voice/VoiceInboxPanel';
import { ReceiptInboxPanel } from '../receipts/ReceiptInboxPanel';

export function MainArea({
  selectedJobId,
  onCloseJob,
}: {
  selectedJobId: string | null;
  onCloseJob: () => void;
}) {
  const job = useLiveQuery(() => (selectedJobId ? db.jobs.get(selectedJobId) : undefined), [selectedJobId]);
  const client = useLiveQuery(() => (job ? db.clients.get(job.client_id) : undefined), [job]);

  if (!selectedJobId) {
    return (
      <>
        <VoiceInboxPanel />
        <ReceiptInboxPanel />
      </>
    );
  }

  if (!job) {
    return <p>Loading…</p>;
  }

  return <JobDetail job={job} clientName={client?.name ?? 'Unknown client'} onClose={onCloseJob} />;
}
