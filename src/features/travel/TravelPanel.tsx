import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { createTravelEntry, updateTravelEntry, deleteTravelEntry } from '../../db/travelEntryRepository';
import { CURRENT_USER_ID } from '../currentUser';
import { formatDate } from '../../lib/date';
import type { TravelEntry } from '../../models/TravelEntry';

function TravelEntryRow({ entry }: { entry: TravelEntry }) {
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState(entry.date);
  const [distanceKm, setDistanceKm] = useState(String(entry.distance_km));
  const [personal, setPersonal] = useState(entry.personal);

  function startEdit() {
    setDate(entry.date);
    setDistanceKm(String(entry.distance_km));
    setPersonal(entry.personal);
    setIsEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await updateTravelEntry(entry.id, { date, distance_km: Number(distanceKm) || 0, personal });
    setIsEditing(false);
  }

  async function handleDelete() {
    await deleteTravelEntry(entry.id);
  }

  if (isEditing) {
    return (
      <li>
        <form onSubmit={handleSave}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input type="number" min="0" step="any" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} />
          <label>
            <input type="checkbox" checked={personal} onChange={(e) => setPersonal(e.target.checked)} />
            Personal
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
      {formatDate(entry.date)} — {entry.distance_km} km{entry.personal && ' (personal)'}{' '}
      <button type="button" onClick={startEdit}>
        Edit
      </button>
      <button type="button" onClick={handleDelete}>
        Delete
      </button>
    </li>
  );
}

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
          <TravelEntryRow key={entry.id} entry={entry} />
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
