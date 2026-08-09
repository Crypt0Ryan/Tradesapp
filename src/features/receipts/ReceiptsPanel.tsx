import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { ReceiptCapture } from './ReceiptCapture';
import { ReceiptCard } from './ReceiptCard';

export function ReceiptsPanel({ jobId }: { jobId: string }) {
  const receipts = useLiveQuery(() => db.receipts.where('job_id').equals(jobId).toArray(), [jobId]);

  const total = receipts?.reduce((sum, r) => sum + (r.total ?? 0), 0) ?? 0;

  return (
    <section>
      <h3>Receipts</h3>

      <ReceiptCapture jobId={jobId} />

      <ul>
        {receipts?.map((receipt) => (
          <ReceiptCard key={receipt.id} receipt={receipt} />
        ))}
        {receipts?.length === 0 && <li>No receipts for this job yet.</li>}
      </ul>
      {receipts && receipts.length > 0 && (
        <p>
          <strong>Receipts total: ${total.toFixed(2)}</strong>
        </p>
      )}
    </section>
  );
}
