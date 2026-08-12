import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Car, Pencil, Trash2, Plus } from 'lucide-react';
import { db } from '../../db/database';
import { createTravelEntry, updateTravelEntry, deleteTravelEntry } from '../../db/travelEntryRepository';
import { CURRENT_USER_ID } from '../currentUser';
import { formatDate, dateToInputValue } from '../../lib/date';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
      <li className="rounded-lg border border-border bg-muted/40 p-3">
        <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          <Input
            type="number"
            min="0"
            step="any"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            className="w-24"
          />
          <Label className="flex items-center gap-2 text-sm">
            <Checkbox checked={personal} onCheckedChange={(checked) => setPersonal(checked === true)} />
            Personal
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
    <li className="flex items-center gap-2 rounded-lg border border-border p-3">
      <span className="font-medium text-foreground">{formatDate(entry.date)}</span>
      <span className="text-muted-foreground">{entry.distance_km} km</span>
      {entry.personal && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">personal</span>
      )}
      <div className="ml-auto flex gap-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={startEdit} aria-label="Edit trip">
          <Pencil className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          aria-label="Delete trip"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}

export function TravelPanel({ jobId }: { jobId: string }) {
  const entries = useLiveQuery(() => db.travelEntries.where('job_id').equals(jobId).toArray(), [jobId]);

  const [distanceKm, setDistanceKm] = useState('');
  const [date, setDate] = useState(() => dateToInputValue(new Date()));
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="size-4.5 text-accent" />
          Travel
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          <Input
            type="number"
            min="0"
            step="any"
            placeholder="km"
            value={distanceKm}
            onChange={(e) => setDistanceKm(e.target.value)}
            className="w-24"
          />
          <Label className="flex items-center gap-2 text-sm">
            <Checkbox checked={personal} onCheckedChange={(checked) => setPersonal(checked === true)} />
            Personal (excluded from tax claim)
          </Label>
          <Button type="submit" size="sm" variant="secondary" className="ml-auto gap-1.5">
            <Plus className="size-4" />
            Add trip
          </Button>
        </form>

        <ul className="flex flex-col gap-2">
          {entries?.map((entry) => (
            <TravelEntryRow key={entry.id} entry={entry} />
          ))}
          {entries?.length === 0 && <li className="text-sm text-muted-foreground">No trips logged yet.</li>}
        </ul>
      </CardContent>

      {entries && entries.length > 0 && (
        <CardFooter className="text-sm">
          <span className="font-semibold text-foreground">Total: {totalKm} km</span>
          <span className="ml-3 text-muted-foreground">Work-related: {workKm} km</span>
        </CardFooter>
      )}
    </Card>
  );
}
