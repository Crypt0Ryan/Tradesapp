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
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <VoiceInboxPanel />
        <ReceiptInboxPanel />
      </div>
    );
  }

  if (!job) {
    return <p className="p-6 text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <JobDetail job={job} clientName={client?.name ?? 'Unknown client'} onClose={onCloseJob} />
    </div>
  );
}
