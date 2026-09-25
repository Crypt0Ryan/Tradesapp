import { addDays, dateToInputValue, formatDate, toDateInputValue } from './date';
import { gstAmount, incGstAmount } from './gst';
import { materialLineTotal } from './materials';
import type { Job } from '../models/Job';
import type { MaterialEntry } from '../models/MaterialEntry';
import type { SubJob } from '../models/SubJob';
import type { TimeEntry } from '../models/TimeEntry';

export interface InvoiceLabourLine {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** One item per line of the entry's notes ("plumbed toilet" / "fixed tap" ...). */
  notes: string[];
  hours: number;
  /** null when the job has no hourly rate, so the line is listed but not priced. */
  amount: number | null;
}

export interface InvoiceMaterialLine {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  markupPct: number;
  amount: number;
}

export interface InvoiceSection {
  /** null = work/materials not assigned to any sub-job. */
  subJobId: string | null;
  name: string;
  labour: InvoiceLabourLine[];
  labourHours: number;
  labourAmount: number;
  materials: InvoiceMaterialLine[];
  materialsAmount: number;
  subtotal: number;
  /** Earliest/latest day labour was carried out in this section (YYYY-MM-DD), null if no labour. */
  dateFrom: string | null;
  dateTo: string | null;
}

export interface InvoiceData {
  sections: InvoiceSection[];
  subtotal: number;
  gst: number;
  total: number;
  dateFrom: string | null;
  dateTo: string | null;
  /** True when billable hours exist but the job has no hourly rate to price them. */
  hasUnpricedLabour: boolean;
}

/** "03/08/2026 – 07/08/2026", or a single date when the range is one day. */
export function formatDateRange(from: string | null, to: string | null): string | null {
  if (!from || !to) return null;
  return from === to ? formatDate(from) : `${formatDate(from)} – ${formatDate(to)}`;
}

/** YYYY-MM-DD plus N calendar days, done on local dates so it can't drift across a timezone boundary. */
export function addDaysToDate(dateValue: string, days: number): string {
  return dateToInputValue(addDays(new Date(`${dateValue}T00:00:00`), days));
}

/**
 * Turns a job's logged time and materials into invoice sections - one per
 * sub-job, plus a trailing "General" section for anything unassigned - each
 * with its own line items, subtotal and date range. Only billable, finished
 * time counts; a labour entry's notes become the line's bullet points.
 */
export function buildInvoice(
  job: Job,
  subJobs: SubJob[],
  timeEntries: TimeEntry[],
  materialEntries: MaterialEntry[],
): InvoiceData {
  const rate = job.hourly_rate;
  const known = new Set(subJobs.map((s) => s.id));
  // An entry pointing at a sub-job that no longer exists falls back to General.
  const keyOf = (id: string | null | undefined) => (id && known.has(id) ? id : null);

  const billable = timeEntries
    .filter((e) => e.billable && e.end_time !== null && (e.duration_minutes ?? 0) > 0)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const orderedKeys: (string | null)[] = [...subJobs.map((s) => s.id), null];

  const sections: InvoiceSection[] = orderedKeys.map((key) => {
    const name = key === null ? (subJobs.length > 0 ? 'General' : '') : (subJobs.find((s) => s.id === key)?.name ?? '');

    const labour: InvoiceLabourLine[] = billable
      .filter((e) => keyOf(e.sub_job_id) === key)
      .map((e) => {
        const hours = (e.duration_minutes ?? 0) / 60;
        return {
          date: toDateInputValue(e.start_time),
          notes: e.notes
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
          hours,
          amount: rate ? hours * rate : null,
        };
      });

    const materials: InvoiceMaterialLine[] = materialEntries
      .filter((m) => keyOf(m.sub_job_id) === key)
      .map((m) => ({
        id: m.id,
        name: m.name,
        quantity: m.quantity,
        unit: m.unit,
        unitCost: m.unit_cost,
        markupPct: m.markup_pct,
        amount: materialLineTotal(m.quantity, m.unit_cost, m.markup_pct),
      }));

    const labourHours = labour.reduce((sum, l) => sum + l.hours, 0);
    const labourAmount = labour.reduce((sum, l) => sum + (l.amount ?? 0), 0);
    const materialsAmount = materials.reduce((sum, m) => sum + m.amount, 0);
    const dates = labour.map((l) => l.date).sort();

    return {
      subJobId: key,
      name,
      labour,
      labourHours,
      labourAmount,
      materials,
      materialsAmount,
      subtotal: labourAmount + materialsAmount,
      dateFrom: dates[0] ?? null,
      dateTo: dates[dates.length - 1] ?? null,
    };
  });

  const nonEmpty = sections.filter((s) => s.labour.length > 0 || s.materials.length > 0);
  const subtotal = nonEmpty.reduce((sum, s) => sum + s.subtotal, 0);
  const allDates = nonEmpty.flatMap((s) => s.labour.map((l) => l.date)).sort();

  return {
    sections: nonEmpty,
    subtotal,
    gst: gstAmount(subtotal),
    total: incGstAmount(subtotal),
    dateFrom: allDates[0] ?? null,
    dateTo: allDates[allDates.length - 1] ?? null,
    hasUnpricedLabour: !rate && billable.length > 0,
  };
}
