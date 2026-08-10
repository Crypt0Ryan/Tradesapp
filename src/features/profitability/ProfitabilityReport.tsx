import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { getBusinessSettings } from '../../lib/businessSettings';
import { computeJobActualCost } from '../../lib/jobCosting';
import { downloadCsv } from '../../lib/csv';
import { formatCurrency } from '../../lib/currency';
import { BusinessDetailsHeader } from '../business/BusinessDetailsHeader';
import { dateToInputValue } from '../../lib/date';

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
    <div className="print-area">
      <div className="no-print">
        <button type="button" onClick={() => window.print()}>
          Print Report
        </button>
        <button type="button" onClick={handleExportCsv}>
          Export CSV
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <h2>Job Profitability Report</h2>
      <BusinessDetailsHeader />
      {!kmRate && (
        <p className="no-print">
          No $/km rate set - travel cost won't be included in "Actual" below. Set one in "Edit business details" if
          you want it costed in.
        </p>
      )}

      <table>
        <thead>
          <tr>
            <th>Job</th>
            <th>Client</th>
            <th>Status</th>
            <th>Quoted</th>
            <th>Actual</th>
            <th>Variance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ job, clientName, cost, variance, variancePct }) => (
            <tr key={job.id}>
              <td>{job.title}</td>
              <td>{clientName}</td>
              <td>{job.status}</td>
              <td>{job.quoted_amount !== null ? `$${job.quoted_amount.toFixed(2)}` : '—'}</td>
              <td>${cost.totalIncGst.toFixed(2)}</td>
              <td style={{ color: variance !== null && variance < 0 ? '#c0392b' : undefined }}>
                {variance !== null
                  ? `${variance >= 0 ? '+' : ''}${formatCurrency(variance)} (${variancePct?.toFixed(0)}%)`
                  : '— not quoted'}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6}>No jobs yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      <table>
        <tbody>
          <tr>
            <td>Total quoted (quoted jobs only)</td>
            <td>${totalQuoted.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Total actual (quoted jobs only)</td>
            <td>${totalActual.toFixed(2)}</td>
          </tr>
          <tr>
            <td>
              <strong>Overall variance</strong>
            </td>
            <td>
              <strong>{formatCurrency(totalQuoted - totalActual)}</strong>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
