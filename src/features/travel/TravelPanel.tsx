import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { createTravelEntry } from '../../db/travelEntryRepository';
import { CURRENT_USER_ID } from '../currentUser';

export function TravelPanel({ jobId }: { jobId: string }) {
  const entries = useLiveQuery(() => db.travelEntries.where('job_id').equals(jobId).toArray(), [jobId]);

  const [distanceKm, setDistanceKm] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [personal, setPersonal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!distanceKm) return;

    await createTravelEntry({
      job_id: jobId,
      user_id: CURRENT_USER_ID,
      start_location: null,
      end_location: null,
      distance_km: Number(distanceKm) || 0,
      source: 'manual',
      personal,
      date,
    });

    setDistanceKm('');
    setPersonal(false);
  }

  const totalKm = entries?.reduce((sum, e) => sum + e.distance_km, 0) ?? 0;
  const workKm = entries?.filter((e) => !e.personal).reduce((sum, e) => sum + e.distance_km, 0) ?? 0;

  return (
    <section>
      <h3>Travel</h3>

      <form onSubmit={handleSubmit}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input
          type="number"
          min="0"
          step="any"
          placeholder="km"
          value={distanceKm}
          onChange={(e) => setDistanceKm(e.target.value)}
        />
        <label>
          <input type="checkbox" checked={personal} onChange={(e) => setPersonal(e.target.checked)} />
          Personal (excluded from tax claim)
        </label>
        <button type="submit">Add trip</button>
      </form>

      <ul>
        {entries?.map((entry) => (
          <li key={entry.id}>
            {entry.date} — {entry.distance_km} km{entry.personal && ' (personal)'}
          </li>
        ))}
        {entries?.length === 0 && <li>No trips logged yet.</li>}
      </ul>
      {entries && entries.length > 0 && (
        <p>
          <strong>
            Total: {totalKm} km — Work-related: {workKm} km
          </strong>
        </p>
      )}
    </section>
  );
}
