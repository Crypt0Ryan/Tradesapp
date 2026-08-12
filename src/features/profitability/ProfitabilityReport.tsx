import { useLiveQuery } from 'dexie-react-hooks';
import { Printer, Download, X, TrendingDown, TrendingUp } from 'lucide-react';
import { db } from '../../db/database';
import { getBusinessSettings } from '../../lib/businessSettings';
import { computeJobActualCost } from '../../lib/jobCosting';
import { downloadCsv } from '../../lib/csv';
import { formatCurrency } from '../../lib/currency';
import { BusinessDetailsHeader } from '../business/BusinessDetailsHeader';
import { dateToInputValue } from '../../lib/date';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function ProfitabilityReport({ onClose }: { onClose: () => void }) {
  const jobs = useLiveQuery(() => db.jobs.toArray(), []);
  const clients = useLiveQuery(() => db.clients.toArray(), []);
  const timeEntries = useLiveQuery(() => db.timeEntries.toArray(), []);
  const materialEntries = useLiveQuery(() => db.materialEntries.toArray(), []);
  const travelEntries = useLiveQuery(() => db.travelEntries.toArray(), []);
  const kmRate = getBusinessSettings().kmRate;

  const rows = (jobs ?? [])
    .map((job) => {
      const cost = computeJobActualCost(
        job,
        (timeEntries ?? []).filter((e) => e.job_id === job.id),
        (materialEntries ?? []).filter((e) => e.job_id === job.id),
        (travelEntries ?? []).filter((e) => e.job_id === job.id),
        kmRate,
      );
      const clientName = clients?.find((c) => c.id === job.client_id)?.name ?? 'Unknown client';
      const variance = job.quoted_amount !== null ? job.quoted_amount - cost.totalIncGst : null;
      const variancePct = job.quoted_amount ? ((variance ?? 0) / job.quoted_amount) * 100 : null;
      return { job, clientName, cost, variance, variancePct };
    })
    // Worst overruns first - the whole point of this report is to surface problems.
    .sort((a, b) => (a.variance ?? Infinity) - (b.variance ?? Infinity));

  const quotedRows = rows.filter((r) => r.job.quoted_amount !== null);
  const totalQuoted = quotedRows.reduce((sum, r) => sum + (r.job.quoted_amount ?? 0), 0);
  const totalActual = quotedRows.reduce((sum, r) => sum + r.cost.totalIncGst, 0);

  function handleExportCsv() {
    const headers = ['Job', 'Client', 'Status', 'Quoted ($)', 'Actual ($)', 'Variance ($)', 'Variance (%)'];
    const csvRows = rows.map((r) => [
      r.job.title,
      r.clientName,
      r.job.status,
      r.job.quoted_amount !== null ? r.job.quoted_amount.toFixed(2) : '',
      r.cost.totalIncGst.toFixed(2),
      r.variance !== null ? r.variance.toFixed(2) : '',
      r.variancePct !== null ? r.variancePct.toFixed(1) : '',
    ]);
    downloadCsv(`profitability_report_${dateToInputValue(new Date())}.csv`, headers, csvRows);
  }

  return (
    <div className="print-area mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div className="no-print flex gap-2">
        <Button type="button" onClick={() => window.print()} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
          <Printer className="size-4" />
          Print Report
        </Button>
        <Button type="button" variant="outline" onClick={handleExportCsv} className="gap-2">
          <Download className="size-4" />
          Export CSV
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
              <h1 className="text-2xl font-semibold text-foreground">Job Profitability Report</h1>
              {!kmRate && (
                <p className="no-print text-sm text-muted-foreground">
                  No $/km rate set - travel cost won't be included in "Actual" below.
                </p>
              )}
            </div>
            <div className="w-full max-w-xs sm:w-auto">
              <BusinessDetailsHeader />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quoted</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead className="text-right">Variance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ job, clientName, cost, variance, variancePct }) => {
                const isOverQuote = variance !== null && variance < 0;
                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium text-foreground">{job.title}</TableCell>
                    <TableCell>{clientName}</TableCell>
                    <TableCell className="capitalize">{job.status}</TableCell>
                    <TableCell>{job.quoted_amount !== null ? formatCurrency(job.quoted_amount) : '—'}</TableCell>
                    <TableCell>{formatCurrency(cost.totalIncGst)}</TableCell>
                    <TableCell className="text-right">
                      {variance !== null ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 font-medium',
                            isOverQuote ? 'text-destructive' : 'text-success',
                          )}
                        >
                          {isOverQuote ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
                          {variance >= 0 ? '+' : ''}
                          {formatCurrency(variance)} ({variancePct?.toFixed(0)}%)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">not quoted</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No jobs yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total quoted (quoted jobs only)</span>
              <span className="text-foreground">{formatCurrency(totalQuoted)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total actual (quoted jobs only)</span>
              <span className="text-foreground">{formatCurrency(totalActual)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 text-base font-semibold">
              <span className="text-foreground">Overall variance</span>
              <span className="text-foreground">{formatCurrency(totalQuoted - totalActual)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
