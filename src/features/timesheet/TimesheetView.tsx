import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Printer, Download, X } from 'lucide-react';
import { db } from '../../db/database';
import { formatDate, toDateInputValue, dateToInputValue, addDays, mondayOfWeek } from '../../lib/date';
import { downloadCsv } from '../../lib/csv';
import { formatCurrency } from '../../lib/currency';
import { BusinessDetailsHeader } from '../business/BusinessDetailsHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export function TimesheetView({ onClose }: { onClose: () => void }) {
  const today = new Date();
  const [startDate, setStartDate] = useState(dateToInputValue(mondayOfWeek(today)));
  const [endDate, setEndDate] = useState(dateToInputValue(addDays(mondayOfWeek(today), 6)));

  const timeEntries = useLiveQuery(() => db.timeEntries.filter((entry) => entry.end_time !== null).toArray(), []);
  const jobs = useLiveQuery(() => db.jobs.toArray(), []);
  const clients = useLiveQuery(() => db.clients.toArray(), []);

  function setPreset(preset: 'thisWeek' | 'lastWeek' | 'fortnight') {
    const monday = mondayOfWeek(today);
    if (preset === 'thisWeek') {
      setStartDate(dateToInputValue(monday));
      setEndDate(dateToInputValue(addDays(monday, 6)));
    } else if (preset === 'lastWeek') {
      const lastMonday = addDays(monday, -7);
      setStartDate(dateToInputValue(lastMonday));
      setEndDate(dateToInputValue(addDays(lastMonday, 6)));
    } else {
      const fortnightStart = addDays(monday, -7);
      setStartDate(dateToInputValue(fortnightStart));
      setEndDate(dateToInputValue(addDays(fortnightStart, 13)));
    }
  }

  const entriesInRange = (timeEntries ?? [])
    .filter((entry) => {
      const entryDate = toDateInputValue(entry.start_time);
      return entryDate >= startDate && entryDate <= endDate;
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  function jobFor(jobId: string) {
    return jobs?.find((j) => j.id === jobId);
  }
  function clientNameFor(job: ReturnType<typeof jobFor>) {
    return clients?.find((c) => c.id === job?.client_id)?.name ?? 'Unknown client';
  }

  const totalHours = entriesInRange.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0) / 60;
  const billableHours = entriesInRange.reduce((sum, e) => sum + (e.billable ? (e.duration_minutes ?? 0) : 0), 0) / 60;
  const billableTotal = entriesInRange.reduce((sum, e) => {
    if (!e.billable) return sum;
    const job = jobFor(e.job_id);
    if (!job?.hourly_rate) return sum;
    return sum + ((e.duration_minutes ?? 0) / 60) * job.hourly_rate;
  }, 0);

  function handleExportCsv() {
    const headers = ['Date', 'Job', 'Client', 'Description', 'Hours', 'Billable', 'Amount ($)'];
    const rows = entriesInRange.map((entry) => {
      const job = jobFor(entry.job_id);
      const hours = (entry.duration_minutes ?? 0) / 60;
      const amount = entry.billable && job?.hourly_rate ? (hours * job.hourly_rate).toFixed(2) : '';
      return [
        formatDate(entry.start_time),
        job?.title ?? 'Unknown job',
        clientNameFor(job),
        entry.notes,
        hours.toFixed(2),
        entry.billable ? 'Yes' : 'No',
        amount,
      ];
    });
    downloadCsv(`timesheet_${startDate}_to_${endDate}.csv`, headers, rows);
  }

  return (
    <div className="print-area mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div className="no-print flex gap-2">
        <Button type="button" onClick={() => window.print()} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
          <Printer className="size-4" />
          Print Timesheet
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
              <h1 className="text-2xl font-semibold text-foreground">Timesheet</h1>
              <p className="text-sm text-muted-foreground">
                {formatDate(startDate)} – {formatDate(endDate)}
              </p>
            </div>
            <div className="w-full max-w-xs sm:w-auto">
              <BusinessDetailsHeader />
            </div>
          </div>

          <div className="no-print flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setPreset('thisWeek')}>
              This week
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPreset('lastWeek')}>
              Last week
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPreset('fortnight')}>
              Last fortnight
            </Button>
            <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              <span>From</span>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
              <span>To</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entriesInRange.map((entry) => {
                const job = jobFor(entry.job_id);
                const hours = (entry.duration_minutes ?? 0) / 60;
                const amount = entry.billable && job?.hourly_rate ? hours * job.hourly_rate : null;
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.start_time)}</TableCell>
                    <TableCell>{job?.title ?? 'Unknown job'}</TableCell>
                    <TableCell>{clientNameFor(job)}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.notes}</TableCell>
                    <TableCell>{hours.toFixed(2)}</TableCell>
                    <TableCell>{entry.billable ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">{amount !== null ? formatCurrency(amount) : '—'}</TableCell>
                  </TableRow>
                );
              })}
              {entriesInRange.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No time logged in this period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total hours</span>
              <span className="text-foreground">{totalHours.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Billable hours</span>
              <span className="text-foreground">{billableHours.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 text-base font-semibold">
              <span className="text-foreground">Billable total</span>
              <span className="text-foreground">{formatCurrency(billableTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
