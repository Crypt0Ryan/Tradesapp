import { useLiveQuery } from 'dexie-react-hooks';
import { Receipt as ReceiptIcon } from 'lucide-react';
import { db } from '../../db/database';
import { ReceiptCapture } from './ReceiptCapture';
import { ReceiptCard } from './ReceiptCard';
import { formatCurrency } from '../../lib/currency';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

export function ReceiptsPanel({ jobId }: { jobId: string }) {
  const receipts = useLiveQuery(() => db.receipts.where('job_id').equals(jobId).toArray(), [jobId]);

  const total = receipts?.reduce((sum, r) => sum + (r.total ?? 0), 0) ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ReceiptIcon className="size-4.5 text-accent" />
          Receipts
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <ReceiptCapture jobId={jobId} />

        <ul className="flex flex-col gap-2">
          {receipts?.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))}
          {receipts?.length === 0 && <li className="text-sm text-muted-foreground">No receipts for this job yet.</li>}
        </ul>
      </CardContent>

      {receipts && receipts.length > 0 && (
        <CardFooter className="text-sm">
          <span className="font-semibold text-foreground">Receipts total: {formatCurrency(total)}</span>
        </CardFooter>
      )}
    </Card>
  );
}
