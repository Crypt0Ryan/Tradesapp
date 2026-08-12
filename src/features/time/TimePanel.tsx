import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Play, Square, Pencil, Trash2, Clock } from 'lucide-react';
import { db } from '../../db/database';
import { startTimer, stopTimer, createTimeEntry, updateTimeEntry, deleteTimeEntry } from '../../db/timeEntryRepository';
import { updateJob } from '../../db/jobRepository';
import { CURRENT_USER_ID } from '../currentUser';
import { formatDate, toDateInputValue, dateToInputValue } from '../../lib/date';
import { gstAmount, incGstAmount } from '../../lib/gst';
import { formatCurrency } from '../../lib/currency';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { TimeEntry } from '../../models/TimeEntry';
import type { Job } from '../../models/Job';

function formatElapsed(startTime: string, nowMs: number) {
  const elapsedMs = Math.max(0, nowMs - new Date(startTime).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Rebuilds start_time/end_time/duration_minutes from a date + hours pair, same math used at creation. */
function recomputeTimes(dateValue: string, hoursValue: number) {
  const durationMinutes = Math.round(hoursValue * 60);
  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  return { start_time: start.toISOString(), end_time: end.toISOString(), duration_minutes: durationMinutes };
}

function TimeEntryRow({ entry }: { entry: TimeEntry }) {
  const [notes, setNotes] = useState(entry.notes);
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState(toDateInputValue(entry.start_time));
  const [hours, setHours] = useState(String((entry.duration_minutes ?? 0) / 60));
  const [billable, setBillable] = useState(entry.billable);

  async function commitNotes() {
    if (notes !== entry.notes) await updateTimeEntry(entry.id, { notes });
  }

  function startEdit() {
    setDate(toDateInputValue(entry.start_time));
    setHours(String((entry.duration_minutes ?? 0) / 60));
    setBillable(entry.billable);
    setIsEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await updateTimeEntry(entry.id, { ...recomputeTimes(date, Number(hours) || 0), billable });
    setIsEditing(false);
  }

  async function handleDelete() {
    await deleteTimeEntry(entry.id);
  }

  if (isEditing) {
    return (
      <li className="rounded-lg border border-border bg-muted/40 p-3">
        <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          <Input
            type="number"
            min="0"
            step="any"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-24"
          />
          <Label className="flex items-center gap-2 text-sm">
            <Checkbox checked={billable} onCheckedChange={(checked) => setBillable(checked === true)} />
            Billable
          </Label>
          <Button type="submit" size="sm">
            Save
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">{formatDate(entry.start_time)}</span>
        <span className="text-muted-foreground">{((entry.duration_minutes ?? 0) / 60).toFixed(2)} hrs</span>
        {!entry.billable && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">non-billable</span>
        )}
        <span className="text-xs text-muted-foreground italic">{entry.source}</span>
        <div className="ml-auto flex gap-1">
          <Button type="button" variant="ghost" size="icon-sm" onClick={startEdit} aria-label="Edit entry">
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            aria-label="Delete entry"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      <Textarea
        rows={2}
        placeholder="What did you do? (e.g. plumbed toilet, then press Enter for the next item)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={commitNotes}
      />
    </li>
  );
}

export function TimePanel({ job }: { job: Job }) {
  const jobId = job.id;
  const entries = useLiveQuery(() => db.timeEntries.where('job_id').equals(jobId).toArray(), [jobId]);
  const runningEntry = entries?.find((e) => e.end_time === null) ?? null;
  const loggedEntries = entries?.filter((e) => e.end_time !== null) ?? [];

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!runningEntry) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [runningEntry]);

  const [hours, setHours] = useState('');
  const [date, setDate] = useState(() => dateToInputValue(new Date()));
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState('');

  const [rateInput, setRateInput] = useState(job.hourly_rate?.toString() ?? '');
  useEffect(() => {
    setRateInput(job.hourly_rate?.toString() ?? '');
  }, [job.hourly_rate]);

  async function commitRate() {
    const parsed = rateInput === '' ? null : Number(rateInput);
    if (parsed !== job.hourly_rate) await updateJob(jobId, { hourly_rate: Number.isFinite(parsed) ? parsed : null });
  }

  async function handleStart() {
    await startTimer(jobId, CURRENT_USER_ID, true);
  }

  async function handleStop() {
    if (runningEntry) await stopTimer(runningEntry.id);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hoursNum = Number(hours);
    if (!hoursNum) return;

    await createTimeEntry({
      job_id: jobId,
      user_id: CURRENT_USER_ID,
      ...recomputeTimes(date, hoursNum),
      billable,
      source: 'manual',
      notes: notes.trim(),
    });

    setHours('');
    setNotes('');
  }

  const totalMinutes = entries?.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0) ?? 0;
  const totalHours = totalMinutes / 60;
  const billableMinutes = entries?.reduce((sum, e) => sum + (e.billable ? (e.duration_minutes ?? 0) : 0), 0) ?? 0;
  const earnings = job.hourly_rate ? (billableMinutes / 60) * job.hourly_rate : null;

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="size-4.5 text-accent" />
          Time
        </CardTitle>
        <Label className="flex items-center gap-2 text-sm text-muted-foreground">
          Hourly rate $
          <Input
            type="number"
            min="0"
            step="any"
            placeholder="e.g. 85"
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
            onBlur={commitRate}
            className="w-24"
          />
        </Label>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {runningEntry ? (
          <div className="flex items-center justify-between rounded-lg bg-accent/10 px-4 py-3">
            <div className="flex items-center gap-2 font-mono text-xl font-semibold text-accent">
              {formatElapsed(runningEntry.start_time, now)}
            </div>
            <Button type="button" variant="destructive" onClick={handleStop} className="gap-2">
              <Square className="size-4" />
              Stop timer
            </Button>
          </div>
        ) : (
          <Button type="button" onClick={handleStart} className="w-fit gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Play className="size-4" />
            Start timer
          </Button>
        )}

        <form onSubmit={handleManualSubmit} className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="Hours"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-24"
            />
            <Label className="flex items-center gap-2 text-sm">
              <Checkbox checked={billable} onCheckedChange={(checked) => setBillable(checked === true)} />
              Billable
            </Label>
            <Button type="submit" size="sm" variant="secondary" className="ml-auto">
              Log manual time
            </Button>
          </div>
          <Textarea
            rows={2}
            placeholder="What did you do? (e.g. plumbed toilet, then press Enter for the next item)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </form>

        <ul className="flex flex-col gap-2">
          {loggedEntries.map((entry) => (
            <TimeEntryRow key={entry.id} entry={entry} />
          ))}
          {loggedEntries.length === 0 && <li className="text-sm text-muted-foreground">No time logged yet.</li>}
        </ul>
      </CardContent>

      {entries && entries.length > 0 && (
        <CardFooter className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="font-semibold text-foreground">Total: {totalHours.toFixed(2)} hrs</span>
          {earnings !== null && (
            <>
              <span className="text-muted-foreground">
                Billable (ex GST) <span className="font-medium text-foreground">{formatCurrency(earnings)}</span>
              </span>
              <span className="text-muted-foreground">
                GST <span className="font-medium text-foreground">{formatCurrency(gstAmount(earnings))}</span>
              </span>
              <span className="text-muted-foreground">
                Total (inc GST){' '}
                <span className="font-semibold text-foreground">{formatCurrency(incGstAmount(earnings))}</span>
              </span>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
