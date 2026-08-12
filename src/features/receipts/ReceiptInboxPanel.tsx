import { useLiveQuery } from 'dexie-react-hooks';
import { Receipt as ReceiptIcon } from 'lucide-react';
import { db } from '../../db/database';
import { listUnassignedReceipts } from '../../db/receiptRepository';
import { ReceiptCapture } from './ReceiptCapture';
import { ReceiptCard } from './ReceiptCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ReceiptIcon className="size-4.5 text-accent" />
          Receipts
        </CardTitle>
        <CardDescription>Snap a receipt before you know which job it belongs to - assign it later.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <ReceiptCapture jobId={null} />

        <ul className="flex flex-col gap-2">
          {receipts?.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} assignableJobs={jobsForAssignment} />
          ))}
          {receipts?.length === 0 && <li className="text-sm text-muted-foreground">No unassigned receipts.</li>}
        </ul>
      </CardContent>
    </Card>
  );
}
