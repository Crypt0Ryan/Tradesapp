import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { HardHat, Pencil, Trash2, Plus } from 'lucide-react';
import { db } from '../../db/database';
import {
  createContractorLog,
  updateContractorLog,
  deleteContractorLog,
} from '../../db/contractorLogRepository';
import { formatDate, dateToInputValue } from '../../lib/date';
import { formatCurrency } from '../../lib/currency';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ContractorLog, ContractorRole } from '../../models/ContractorLog';

const ROLES: ContractorRole[] = ['subcontractor', 'apprentice', 'other'];

function ContractorLogRow({ entry }: { entry: ContractorLog }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(entry.name);
  const [role, setRole] = useState(entry.role);
  const [date, setDate] = useState(entry.date);
  const [hours, setHours] = useState(entry.hours?.toString() ?? '');
  const [hourlyRate, setHourlyRate] = useState(entry.hourly_rate?.toString() ?? '');
  const [notes, setNotes] = useState(entry.notes);

  function startEdit() {
    setName(entry.name);
    setRole(entry.role);
    setDate(entry.date);
    setHours(entry.hours?.toString() ?? '');
    setHourlyRate(entry.hourly_rate?.toString() ?? '');
    setNotes(entry.notes);
    setIsEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await updateContractorLog(entry.id, {
      name: name.trim(),
      role,
      date,
      hours: hours === '' ? null : Number(hours),
      hourly_rate: hourlyRate === '' ? null : Number(hourlyRate),
      notes: notes.trim(),
    });
    setIsEditing(false);
  }

  async function handleDelete() {
    await deleteContractorLog(entry.id);
  }

  if (isEditing) {
    return (
      <li className="rounded-lg border border-border bg-muted/40 p-3">
        <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="min-w-32 flex-1" />
          <Select value={role} onValueChange={(v) => setRole(v as ContractorRole)}>
            <SelectTrigger className="w-36 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r} className="capitalize">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Input
            type="number"
            min="0"
            step="any"
            placeholder="Rate $/hr"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="w-28"
          />
          <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-w-32 flex-1" />
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
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
      <span className="font-medium text-foreground">{entry.name}</span>
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize">{entry.role}</span>
      <span className="text-muted-foreground">{formatDate(entry.date)}</span>
      {entry.hours !== null && <span className="text-muted-foreground">{entry.hours.toFixed(2)} hrs</span>}
      {entry.hourly_rate !== null && (
        <span className="text-muted-foreground">{formatCurrency(entry.hourly_rate)}/hr</span>
      )}
      {entry.hours !== null && entry.hourly_rate !== null && (
        <span className="font-medium text-foreground">{formatCurrency(entry.hours * entry.hourly_rate)}</span>
      )}
      {entry.notes && <span className="text-muted-foreground italic">{entry.notes}</span>}
      <div className="ml-auto flex gap-1">
        <Button type="button" variant="ghost" size="icon-sm" onClick={startEdit} aria-label="Edit contractor entry">
          <Pencil className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          aria-label="Delete contractor entry"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}

export function ContractorsPanel({ jobId }: { jobId: string }) {
  const entries = useLiveQuery(() => db.contractorLogs.where('job_id').equals(jobId).toArray(), [jobId]);

  const [name, setName] = useState('');
  const [role, setRole] = useState<ContractorRole>('subcontractor');
  const [date, setDate] = useState(() => dateToInputValue(new Date()));
  const [hours, setHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    await createContractorLog({
      job_id: jobId,
      name: name.trim(),
      role,
      date,
      hours: hours === '' ? null : Number(hours),
      hourly_rate: hourlyRate === '' ? null : Number(hourlyRate),
      notes: notes.trim(),
    });

    setName('');
    setHours('');
    setHourlyRate('');
    setNotes('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HardHat className="size-4.5 text-accent" />
          Contractors on Site
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
          <Input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="min-w-32 flex-1" />
          <Select value={role} onValueChange={(v) => setRole(v as ContractorRole)}>
            <SelectTrigger className="w-36 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r} className="capitalize">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          <Input
            type="number"
            min="0"
            step="any"
            placeholder="Hours (optional)"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-32"
          />
          <Input
            type="number"
            min="0"
            step="any"
            placeholder="Rate $/hr (optional)"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="w-36"
          />
          <Input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-w-32 flex-1"
          />
          <Button type="submit" size="sm" variant="secondary" className="gap-1.5">
            <Plus className="size-4" />
            Add
          </Button>
        </form>

        <ul className="flex flex-col gap-2">
          {entries?.map((entry) => (
            <ContractorLogRow key={entry.id} entry={entry} />
          ))}
          {entries?.length === 0 && (
            <li className="text-sm text-muted-foreground">No contractors logged on site for this job yet.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
