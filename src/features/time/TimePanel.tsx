import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { startTimer, stopTimer, createTimeEntry } from '../../db/timeEntryRepository';
import { CURRENT_USER_ID } from '../currentUser';

function formatElapsed(startTime: string, nowMs: number) {
  const elapsedMs = Math.max(0, nowMs - new Date(startTime).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function TimePanel({ jobId }: { jobId: string }) {
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

    const durationMinutes = Math.round(hoursNum * 60);
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(start.getTime() + durationMinutes * 60000);

    await createTimeEntry({
      job_id: jobId,
      user_id: CURRENT_USER_ID,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: durationMinutes,
      billable,
      source: 'manual',
      notes: '',
    });

    setHours('');
  }

  const totalMinutes = entries?.reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0) ?? 0;
  const totalHours = (totalMinutes / 60).toFixed(2);

  return (
    <section>
      <h3>Time</h3>

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
            <li key={entry.id}>
              {entry.start_time.slice(0, 10)} — {((entry.duration_minutes ?? 0) / 60).toFixed(2)} hrs
              {!entry.billable && ' (non-billable)'} — <em>{entry.source}</em>
            </li>
          ))}
        {entries?.filter((e) => e.end_time !== null).length === 0 && <li>No time logged yet.</li>}
      </ul>
      {entries && entries.length > 0 && (
        <p>
          <strong>Total: {totalHours} hrs</strong>
        </p>
      )}
    </section>
  );
}
