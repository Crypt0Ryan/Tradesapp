import { gstAmount, incGstAmount } from './gst';
import { materialLineTotal } from './materials';
import type { Job } from '../models/Job';
import type { TimeEntry } from '../models/TimeEntry';
import type { MaterialEntry } from '../models/MaterialEntry';
import type { TravelEntry } from '../models/TravelEntry';

export interface JobActualCost {
  labourCost: number;
  materialsCost: number;
  travelCost: number;
  subtotalExGst: number;
  gst: number;
  totalIncGst: number;
}

/**
 * Your own internal cost picture for a job - used for the profitability
 * report, not necessarily identical to what's on the client invoice (which
 * deliberately doesn't itemize travel as a billed line - see InvoiceView).
 */
export function computeJobActualCost(
  job: Job,
  timeEntries: TimeEntry[],
  materialEntries: MaterialEntry[],
  travelEntries: TravelEntry[],
  kmRate: number | null,
): JobActualCost {
  const billableMinutes = timeEntries.reduce((sum, e) => sum + (e.billable ? (e.duration_minutes ?? 0) : 0), 0);
  const labourCost = job.hourly_rate ? (billableMinutes / 60) * job.hourly_rate : 0;

  const materialsCost = materialEntries.reduce(
    (sum, e) => sum + materialLineTotal(e.quantity, e.unit_cost, e.markup_pct),
    0,
  );

  const workKm = travelEntries.reduce((sum, e) => sum + (e.personal ? 0 : e.distance_km), 0);
  const travelCost = kmRate ? workKm * kmRate : 0;

  const subtotalExGst = labourCost + materialsCost + travelCost;
  const gst = gstAmount(subtotalExGst);
  const totalIncGst = incGstAmount(subtotalExGst);

  return { labourCost, materialsCost, travelCost, subtotalExGst, gst, totalIncGst };
}
