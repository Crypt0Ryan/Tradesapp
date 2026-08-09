import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { formatDate, toDateInputValue, dateToInputValue, addDays, mondayOfWeek } from '../../lib/date';
import { downloadCsv } from '../../lib/csv';
import { BusinessDetailsHeader } from '../business/BusinessDetailsHeader';

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
    <div className="print-area">
      <div className="no-print">
        <button type="button" onClick={() => window.print()}>
          Print Timesheet
        </button>
        <button type="button" onClick={handleExportCsv}>
          Export CSV
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <h2>Timesheet</h2>
      <BusinessDetailsHeader />

      <div className="no-print">
        <button type="button" onClick={() => setPreset('thisWeek')}>
          This week
        </button>
        <button type="button" onClick={() => setPreset('lastWeek')}>
          Last week
        </button>
        <button type="button" onClick={() => setPreset('fortnight')}>
          Last fortnight
        </button>
        <label>
          From <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          To <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
      </div>

      <p>
        {formatDate(startDate)} – {formatDate(endDate)}
      </p>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Job</th>
            <th>Client</th>
            <th>Description</th>
            <th>Hours</th>
            <th>Billable</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {entriesInRange.map((entry) => {
            const job = jobFor(entry.job_id);
            const hours = (entry.duration_minutes ?? 0) / 60;
            const amount = entry.billable && job?.hourly_rate ? hours * job.hourly_rate : null;
            return (
              <tr key={entry.id}>
                <td>{formatDate(entry.start_time)}</td>
                <td>{job?.title ?? 'Unknown job'}</td>
                <td>{clientNameFor(job)}</td>
                <td>{entry.notes}</td>
                <td>{hours.toFixed(2)}</td>
                <td>{entry.billable ? 'Yes' : 'No'}</td>
                <td>{amount !== null ? `$${amount.toFixed(2)}` : '—'}</td>
              </tr>
            );
          })}
          {entriesInRange.length === 0 && (
            <tr>
              <td colSpan={7}>No time logged in this period.</td>
            </tr>
          )}
        </tbody>
      </table>

      <table>
        <tbody>
          <tr>
            <td>Total hours</td>
            <td>{totalHours.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Billable hours</td>
            <td>{billableHours.toFixed(2)}</td>
          </tr>
          <tr>
            <td>
              <strong>Billable total</strong>
            </td>
            <td>
              <strong>${billableTotal.toFixed(2)}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
