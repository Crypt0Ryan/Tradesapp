import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Printer, X, TriangleAlert } from 'lucide-react';
import { db } from '../../db/database';
import { updateJob } from '../../db/jobRepository';
import { getBusinessSettings } from '../../lib/businessSettings';
import { addDaysToDate, buildInvoice, formatDateRange } from '../../lib/invoice';
import { dateToInputValue, formatDate } from '../../lib/date';
import { formatCurrency } from '../../lib/currency';
import { BusinessDetailsHeader } from '../business/BusinessDetailsHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField } from '@/components/FormField';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { InvoiceSettings, Job } from '../../models/Job';

export function InvoiceView({ job, onClose }: { job: Job; onClose: () => void }) {
  const client = useLiveQuery(() => db.clients.get(job.client_id), [job.client_id]);
  const timeEntries = useLiveQuery(() => db.timeEntries.where('job_id').equals(job.id).toArray(), [job.id]);
  const materialEntries = useLiveQuery(() => db.materialEntries.where('job_id').equals(job.id).toArray(), [job.id]);
  const subJobs = useLiveQuery(() => db.subJobs.where('job_id').equals(job.id).sortBy('created_at'), [job.id]);

  const [business, setBusiness] = useState(getBusinessSettings);

  // Editable invoice fields. Kept locally while typing and saved onto the job when you leave the field.
  const defaultNumber = `INV-${job.id.slice(0, 8).toUpperCase()}`;
  const [number, setNumber] = useState(job.invoice?.number ?? '');
  const [date, setDate] = useState(job.invoice?.date ?? '');
  const [dueDate, setDueDate] = useState(job.invoice?.due_date ?? '');
  const [notes, setNotes] = useState(job.invoice?.notes ?? '');
  const detailed = job.invoice?.detailed ?? true;

  function saveInvoice(patch: Partial<InvoiceSettings>) {
    return updateJob(job.id, { invoice: { ...job.invoice, ...patch } });
  }

  const invoiceNumber = number.trim() || defaultNumber;
  const invoiceDate = date || dateToInputValue(new Date());
  const effectiveDue =
    dueDate || (business.paymentTermsDays != null ? addDaysToDate(invoiceDate, business.paymentTermsDays) : null);

  const invoice = buildInvoice(job, subJobs ?? [], timeEntries ?? [], materialEntries ?? []);
  const workRange = formatDateRange(invoice.dateFrom, invoice.dateTo);
  const hasSubJobs = (subJobs?.length ?? 0) > 0;
  const rate = job.hourly_rate;

  const hasBankDetails = Boolean(business.bankAccountName || business.bsb || business.accountNumber);
  const hasPaymentInfo = hasBankDetails || Boolean(business.paymentNotes) || Boolean(effectiveDue);

  return (
    <div className="print-area mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <div className="no-print flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => window.print()} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
          <Printer className="size-4" />
          Print Invoice
        </Button>
        <Button type="button" variant="outline" onClick={onClose} className="gap-2">
          <X className="size-4" />
          Close
        </Button>
        <Label className="ml-auto flex items-center gap-2 text-sm">
          <Checkbox
            checked={detailed}
            onCheckedChange={(checked) => saveInvoice({ detailed: checked === true })}
          />
          Itemise labour entry by entry
        </Label>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Tax Invoice</h1>
              <p className="text-sm text-muted-foreground">
                {invoiceNumber} · {formatDate(invoiceDate)}
                {effectiveDue && ` · Due ${formatDate(effectiveDue)}`}
              </p>
            </div>
            <div className="w-full max-w-xs sm:w-auto">
              <BusinessDetailsHeader onSaved={setBusiness} />
            </div>
          </div>

          {/* Editable invoice details - screen only; the values above are what prints. */}
          <div className="no-print grid gap-3 rounded-lg border border-dashed border-border p-3 sm:grid-cols-3">
            <FormField label="Invoice number">
              <Input
                value={number}
                placeholder={defaultNumber}
                onChange={(e) => setNumber(e.target.value)}
                onBlur={() => saveInvoice({ number: number.trim() || undefined })}
              />
            </FormField>
            <FormField label="Invoice date">
              <Input
                type="date"
                value={date || invoiceDate}
                onChange={(e) => setDate(e.target.value)}
                onBlur={() => saveInvoice({ date: date || undefined })}
              />
            </FormField>
            <FormField label="Due date">
              <Input
                type="date"
                value={dueDate || effectiveDue || ''}
                onChange={(e) => setDueDate(e.target.value)}
                onBlur={() => saveInvoice({ due_date: dueDate || undefined })}
              />
            </FormField>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Bill To</h2>
            <p className="font-medium text-foreground">{client?.name}</p>
            {client?.contact_info && <p className="text-sm text-muted-foreground">{client.contact_info}</p>}
            {client?.address && <p className="text-sm whitespace-pre-line text-muted-foreground">{client.address}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">{job.title}</h2>
            {workRange && (
              <p className="text-sm text-muted-foreground">
                Work carried out: <span className="font-medium text-foreground">{workRange}</span>
              </p>
            )}
          </div>

          {/* Free-text description/notes: an editable box on screen, plain text when printed. */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invoice-notes" className="no-print text-sm font-medium">
              Description of works / notes <span className="font-normal text-muted-foreground">(printed on the invoice)</span>
            </Label>
            <Textarea
              id="invoice-notes"
              rows={4}
              className="no-print"
              placeholder="Describe the work, add terms, or anything else the client should see…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => saveInvoice({ notes: notes.trim() ? notes : undefined })}
            />
            {notes.trim() && <p className="hidden text-sm whitespace-pre-wrap text-foreground print:block">{notes}</p>}
          </div>

          {invoice.hasUnpricedLabour && (
            <p className="no-print flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm text-foreground">
              <TriangleAlert className="size-4 shrink-0 text-accent" />
              This job has billable hours but no hourly rate, so labour is listed without a price. Set the hourly rate in
              the Time panel to charge for it.
            </p>
          )}

          <p className="no-print text-xs text-muted-foreground sm:hidden">Swipe the tables sideways to see rates and amounts.</p>

          <div className="flex flex-col gap-6">
            {invoice.sections.map((section) => {
              const sectionRange = formatDateRange(section.dateFrom, section.dateTo);
              const hasBoth = section.labour.length > 0 && section.materials.length > 0;
              return (
                <section key={section.subJobId ?? 'general'} className="flex flex-col gap-2">
                  {section.name && (
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-border pb-1">
                      <h3 className="text-base font-semibold text-foreground">{section.name}</h3>
                      {sectionRange && <span className="text-sm text-muted-foreground">Work carried out {sectionRange}</span>}
                    </div>
                  )}
                  <Table className="min-w-[36rem] table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-28">Qty / Hours</TableHead>
                        <TableHead className="w-28">Rate</TableHead>
                        <TableHead className="w-36 text-right">Amount (ex GST)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hasBoth && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={5} className="pb-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Labour
                          </TableCell>
                        </TableRow>
                      )}
                      {section.labour.length > 0 &&
                        (detailed ? (
                          section.labour.map((l, i) => (
                            <TableRow key={`${l.date}-${i}`}>
                              <TableCell className="align-top whitespace-nowrap">{formatDate(l.date)}</TableCell>
                              <TableCell className="align-top whitespace-normal">
                                {l.notes.length > 1 ? (
                                  <ul className="list-disc pl-4">
                                    {l.notes.map((n, j) => (
                                      <li key={j}>{n}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  (l.notes[0] ?? 'Labour')
                                )}
                              </TableCell>
                              <TableCell className="align-top whitespace-nowrap">{l.hours.toFixed(2)} hrs</TableCell>
                              <TableCell className="align-top whitespace-nowrap">{rate ? `${formatCurrency(rate)}/hr` : '—'}</TableCell>
                              <TableCell className="text-right align-top">{l.amount !== null ? formatCurrency(l.amount) : '—'}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell className="align-top whitespace-nowrap">{sectionRange ?? ''}</TableCell>
                            <TableCell className="align-top whitespace-normal">Labour</TableCell>
                            <TableCell className="align-top whitespace-nowrap">{section.labourHours.toFixed(2)} hrs</TableCell>
                            <TableCell className="align-top whitespace-nowrap">{rate ? `${formatCurrency(rate)}/hr` : '—'}</TableCell>
                            <TableCell className="text-right align-top">{rate ? formatCurrency(section.labourAmount) : '—'}</TableCell>
                          </TableRow>
                        ))}
                      {hasBoth && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={5} className="pb-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Materials
                          </TableCell>
                        </TableRow>
                      )}
                      {section.materials.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell />
                          <TableCell className="whitespace-normal">{m.name}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {m.quantity} {m.unit}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatCurrency(m.unitCost)}
                            {m.markupPct > 0 && ` (+${m.markupPct}%)`}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(m.amount)}</TableCell>
                        </TableRow>
                      ))}
                      {invoice.sections.length > 1 && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={4} className="text-right font-medium">
                            Subtotal{section.name ? ` – ${section.name}` : ''}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(section.subtotal)}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </section>
              );
            })}
            {invoice.sections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing billable logged against this job yet{hasSubJobs ? '' : '.'}
              </p>
            )}
          </div>

          <div className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal (ex GST)</span>
              <span className="text-foreground">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (10%)</span>
              <span className="text-foreground">{formatCurrency(invoice.gst)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 text-base font-semibold">
              <span className="text-foreground">Total (inc GST)</span>
              <span className="text-foreground">{formatCurrency(invoice.total)}</span>
            </div>
          </div>

          {hasPaymentInfo ? (
            <div className="flex flex-col gap-1 rounded-lg border border-border p-4 text-sm">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Payment details</h2>
              {effectiveDue && (
                <p>
                  <span className="text-muted-foreground">Payment due:</span>{' '}
                  <span className="font-medium text-foreground">{formatDate(effectiveDue)}</span>
                </p>
              )}
              {hasBankDetails && (
                <div className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                  {business.bankAccountName && (
                    <p>
                      <span className="text-muted-foreground">Account name:</span>{' '}
                      <span className="font-medium text-foreground">{business.bankAccountName}</span>
                    </p>
                  )}
                  {business.bsb && (
                    <p>
                      <span className="text-muted-foreground">BSB:</span>{' '}
                      <span className="font-medium text-foreground">{business.bsb}</span>
                    </p>
                  )}
                  {business.accountNumber && (
                    <p>
                      <span className="text-muted-foreground">Account number:</span>{' '}
                      <span className="font-medium text-foreground">{business.accountNumber}</span>
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Reference:</span>{' '}
                    <span className="font-medium text-foreground">{invoiceNumber}</span>
                  </p>
                </div>
              )}
              {business.paymentNotes && <p className="text-muted-foreground">{business.paymentNotes}</p>}
            </div>
          ) : (
            <p className="no-print rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
              No payment details yet - use "Edit business &amp; billing details" above to add your bank account and
              payment terms, and they'll print on the invoice.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
