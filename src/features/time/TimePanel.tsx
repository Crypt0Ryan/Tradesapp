import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { startTimer, stopTimer, createTimeEntry, updateTimeEntry, deleteTimeEntry } from '../../db/timeEntryRepository';
import { updateJob } from '../../db/jobRepository';
import { CURRENT_USER_ID } from '../currentUser';
import { formatDate, toDateInputValue } from '../../lib/date';
import { gstAmount, incGstAmount } from '../../lib/gst';
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
      <li>
        <form onSubmit={handleSave}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input type="number" min="0" step="any" value={hours} onChange={(e) => setHours(e.target.value)} />
          <label>
            <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
            Billable
          </label>
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li>
      {formatDate(entry.start_time)} — {((entry.duration_minutes ?? 0) / 60).toFixed(2)} hrs
      {!entry.billable && ' (non-billable)'} — <em>{entry.source}</em>{' '}
      <button type="button" onClick={startEdit}>
        Edit
      </button>
      <button type="button" onClick={handleDelete}>
        Delete
      </button>
      <br />
      <input
        type="text"
        placeholder="What did you do? (e.g. installed toilet plumbing)"
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

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!runningEntry) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [runningEntry]);

  const [hours, setHours] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
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
    <section>
      <h3>Time</h3>

      <label>
        Hourly rate $
        <input
          type="number"
          min="0"
          step="any"
          placeholder="e.g. 85"
          value={rateInput}
          onChange={(e) => setRateInput(e.target.value)}
          onBlur={commitRate}
        />
      </label>

      {runningEntry ? (
        <p>
          Timer running: <strong>{formatElapsed(runningEntry.start_time, now)}</strong>{' '}
          <button type="button" onClick={handleStop}>
            Stop timer
          </button>
        </p>
      ) : (
        <button type="button" onClick={handleStart}>
          Start timer
        </button>
      )}

      <form onSubmit={handleManualSubmit}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Hours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />
        <input
          type="text"
          placeholder="What did you do? (e.g. installed toilet plumbing)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <label>
          <input type="checkbox" checked={billable} onChange={(e) => setBillable(e.target.checked)} />
          Billable
        </label>
        <button type="submit">Log manual time</button>
      </form>

      <ul>
        {entries
          ?.filter((e) => e.end_time !== null)
          .map((entry) => (
            <TimeEntryRow key={entry.id} entry={entry} />
          ))}
        {entries?.filter((e) => e.end_time !== null).length === 0 && <li>No time logged yet.</li>}
      </ul>
      {entries && entries.length > 0 && (
        <p>
          <strong>Total: {totalHours.toFixed(2)} hrs</strong>
          {earnings !== null && (
            <>
              {' — '}
              <strong>Billable (ex GST): ${earnings.toFixed(2)}</strong>
              {' — '}
              GST: ${gstAmount(earnings).toFixed(2)}
              {' — '}
              <strong>Total (inc GST): ${incGstAmount(earnings).toFixed(2)}</strong>
            </>
          )}
        </p>
      )}
    </section>
  );
}
