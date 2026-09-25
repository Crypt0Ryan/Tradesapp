import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Car, Pencil, Trash2, Plus } from 'lucide-react';
import { db } from '../../db/database';
import { createTravelEntry, updateTravelEntry, deleteTravelEntry } from '../../db/travelEntryRepository';
import { CURRENT_USER_ID } from '../currentUser';
import { formatDate, dateToInputValue, toDateInputValue } from '../../lib/date';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { TravelEntry } from '../../models/TravelEntry';

function TravelEntryRow({ entry }: { entry: TravelEntry }) {
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState(entry.date);
  const [distanceKm, setDistanceKm] = useState(String(entry.distance_km));
  const [kmPerDay, setKmPerDay] = useState(String(entry.km_per_day ?? ''));
  const [days, setDays] = useState(String(entry.days ?? ''));
  const [personal, setPersonal] = useState(entry.personal);
  const isDaily = entry.days != null && entry.km_per_day != null;

  function startEdit() {
    setDate(entry.date);
    setDistanceKm(String(entry.distance_km));
    setKmPerDay(String(entry.km_per_day ?? ''));
    setDays(String(entry.days ?? ''));
    setPersonal(entry.personal);
    setIsEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isDaily) {
      const perDay = Number(kmPerDay) || 0;
      const dayCount = Number(days) || 0;
      // distance_km stays the total, so every report/costing calc keeps working unchanged.
      await updateTravelEntry(entry.id, {
        date,
        km_per_day: perDay,
        days: dayCount,
        distance_km: perDay * dayCount,
        personal,
      });
    } else {
      await updateTravelEntry(entry.id, { date, distance_km: Number(distanceKm) || 0, personal });
    }
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
          {isDaily ? (
            <>
              <Input
                type="number"
                min="0"
                step="any"
                value={kmPerDay}
                onChange={(e) => setKmPerDay(e.target.value)}
                aria-label="km per day"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">km/day ×</span>
              <Input
                type="number"
                min="0"
                step="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                aria-label="days"
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </>
          ) : (
            <Input
              type="number"
              min="0"
              step="any"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="w-24"
            />
          )}
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
      {isDaily ? (
        <span className="text-muted-foreground">
          {entry.km_per_day} km/day × {entry.days} {entry.days === 1 ? 'day' : 'days'} ={' '}
          <span className="font-medium text-foreground">{entry.distance_km} km</span>
        </span>
      ) : (
        <span className="text-muted-foreground">{entry.distance_km} km</span>
      )}
      {entry.personal && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">personal</span>
      )}
      <div className="ml-auto flex gap-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={startEdit} aria-label="Edit trip">
          <Pencil className="size-3.5" />
        </Button>
        <ConfirmDeleteButton
          onConfirm={handleDelete}
          title="Delete this trip?"
          description={`This will permanently remove the ${entry.distance_km}km of travel starting ${formatDate(entry.date)}. This can't be undone.`}
          variant="ghost"
          size="icon-sm"
          aria-label="Delete trip"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </ConfirmDeleteButton>
      </div>
    </li>
  );
}

export function TravelPanel({ jobId }: { jobId: string }) {
  const entries = useLiveQuery(() => db.travelEntries.where('job_id').equals(jobId).toArray(), [jobId]);

  const timeEntries = useLiveQuery(() => db.timeEntries.where('job_id').equals(jobId).toArray(), [jobId]);

  const [mode, setMode] = useState<'trip' | 'daily'>('trip');
  const [distanceKm, setDistanceKm] = useState('');
  const [kmPerDay, setKmPerDay] = useState('');
  const [days, setDays] = useState('');
  const [date, setDate] = useState(() => dateToInputValue(new Date()));
  const [personal, setPersonal] = useState(false);

  // Distinct calendar days with time logged on this job - a handy default for "how many days did I drive out".
  const daysWorked = new Set(
    (timeEntries ?? []).filter((e) => e.end_time !== null).map((e) => toDateInputValue(e.start_time)),
  ).size;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === 'daily') {
      const perDay = Number(kmPerDay) || 0;
      const dayCount = Number(days) || 0;
      if (!perDay || !dayCount) return;

      await createTravelEntry({
        job_id: jobId,
        user_id: CURRENT_USER_ID,
        start_location: null,
        end_location: null,
        distance_km: perDay * dayCount,
        km_per_day: perDay,
        days: dayCount,
        source: 'manual',
        personal,
        date,
      });

      setKmPerDay('');
      setDays('');
    } else {
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
    }
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
          <div className="flex gap-1 rounded-lg bg-muted p-1 sm:w-fit" role="group" aria-label="Travel entry type">
            {(
              [
                ['trip', 'One-off trip'],
                ['daily', 'Daily run × days'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
                className={cn(
                  'min-h-9 flex-1 rounded-md px-3 text-sm font-medium transition-colors sm:flex-none',
                  mode === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label={mode === 'daily' ? 'First day' : 'Date'}
              className="w-40"
            />
            {mode === 'daily' ? (
              <>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="km per day"
                  value={kmPerDay}
                  onChange={(e) => setKmPerDay(e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">×</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="days"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-24"
                />
                {daysWorked > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDays(String(daysWorked))}>
                    Use {daysWorked} {daysWorked === 1 ? 'day' : 'days'} worked
                  </Button>
                )}
                {Number(kmPerDay) > 0 && Number(days) > 0 && (
                  <span className="text-sm font-medium text-foreground">= {Number(kmPerDay) * Number(days)} km</span>
                )}
              </>
            ) : (
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="km"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-24"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Label className="flex items-center gap-2 text-sm">
              <Checkbox checked={personal} onCheckedChange={(checked) => setPersonal(checked === true)} />
              Personal (excluded from tax claim)
            </Label>
            <Button type="submit" size="sm" variant="secondary" className="ml-auto gap-1.5">
              <Plus className="size-4" />
              {mode === 'daily' ? 'Add daily run' : 'Add trip'}
            </Button>
          </div>
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
