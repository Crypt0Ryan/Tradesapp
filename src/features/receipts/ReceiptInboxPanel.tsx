import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { listUnassignedReceipts } from '../../db/receiptRepository';
import { ReceiptCapture } from './ReceiptCapture';
import { ReceiptCard } from './ReceiptCard';

export function ReceiptInboxPanel() {
  const receipts = useLiveQuery(() => listUnassignedReceipts(), []);
  const jobs = useLiveQuery(() => db.jobs.toArray(), []);
  const clients = useLiveQuery(() => db.clients.toArray(), []);

  const jobsForAssignment =
    jobs?.map((job) => ({
      ...job,
      title: `${job.title} — ${clients?.find((c) => c.id === job.client_id)?.name ?? 'Unknown client'}`,
    })) ?? [];

  return (
    <section>
      <h2>Receipts</h2>
      <p>Snap a receipt before you know which job it belongs to - assign it later.</p>

      <ReceiptCapture jobId={null} />

      <ul>
        {receipts?.map((receipt) => (
          <ReceiptCard key={receipt.id} receipt={receipt} assignableJobs={jobsForAssignment} />
        ))}
        {receipts?.length === 0 && <li>No unassigned receipts.</li>}
      </ul>
    </section>
  );
}
