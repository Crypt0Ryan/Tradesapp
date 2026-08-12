import { useLiveQuery } from 'dexie-react-hooks';
import { Printer, X } from 'lucide-react';
import { db } from '../../db/database';
import { gstAmount, incGstAmount } from '../../lib/gst';
import { materialLineTotal } from '../../lib/materials';
import { formatDate } from '../../lib/date';
import { formatCurrency } from '../../lib/currency';
import { BusinessDetailsHeader } from '../business/BusinessDetailsHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { Job } from '../../models/Job';

export function InvoiceView({ job, onClose }: { job: Job; onClose: () => void }) {
  const client = useLiveQuery(() => db.clients.get(job.client_id), [job.client_id]);
  const timeEntries = useLiveQuery(() => db.timeEntries.where('job_id').equals(job.id).toArray(), [job.id]);
  const materialEntries = useLiveQuery(() => db.materialEntries.where('job_id').equals(job.id).toArray(), [job.id]);

  const billableMinutes = timeEntries?.reduce((sum, e) => sum + (e.billable ? (e.duration_minutes ?? 0) : 0), 0) ?? 0;
  const billableHours = billableMinutes / 60;
  const labourCost = job.hourly_rate ? billableHours * job.hourly_rate : 0;
  const materialsCost =
    materialEntries?.reduce((sum, e) => sum + materialLineTotal(e.quantity, e.unit_cost, e.markup_pct), 0) ?? 0;
  const subtotal = labourCost + materialsCost;

  const invoiceNumber = `INV-${job.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = formatDate(new Date().toISOString());

  return (
    <div className="print-area mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <div className="no-print flex gap-2">
        <Button type="button" onClick={() => window.print()} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
          <Printer className="size-4" />
          Print Invoice
        </Button>
        <Button type="button" variant="outline" onClick={onClose} className="gap-2">
          <X className="size-4" />
          Close
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Tax Invoice</h1>
              <p className="text-sm text-muted-foreground">
                {invoiceNumber} · {invoiceDate}
              </p>
            </div>
            <div className="w-full max-w-xs sm:w-auto">
              <BusinessDetailsHeader />
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Bill To</h2>
            <p className="font-medium text-foreground">{client?.name}</p>
            {client?.contact_info && <p className="text-sm text-muted-foreground">{client.contact_info}</p>}
            {client?.address && <p className="text-sm text-muted-foreground">{client.address}</p>}
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">{job.title}</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Qty / Hours</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Amount (ex GST)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {job.hourly_rate && billableHours > 0 && (
                  <TableRow>
                    <TableCell>Labour</TableCell>
                    <TableCell>{billableHours.toFixed(2)} hrs</TableCell>
                    <TableCell>{formatCurrency(job.hourly_rate)}/hr</TableCell>
                    <TableCell className="text-right">{formatCurrency(labourCost)}</TableCell>
                  </TableRow>
                )}
                {materialEntries?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>
                      {entry.quantity} {entry.unit}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(entry.unit_cost)}
                      {entry.markup_pct > 0 && ` (+${entry.markup_pct}%)`}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(materialLineTotal(entry.quantity, entry.unit_cost, entry.markup_pct))}
                    </TableCell>
                  </TableRow>
                ))}
                {!job.hourly_rate && materialEntries?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      Nothing logged against this job yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal (ex GST)</span>
              <span className="text-foreground">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (10%)</span>
              <span className="text-foreground">{formatCurrency(gstAmount(subtotal))}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 text-base font-semibold">
              <span className="text-foreground">Total (inc GST)</span>
              <span className="text-foreground">{formatCurrency(incGstAmount(subtotal))}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
