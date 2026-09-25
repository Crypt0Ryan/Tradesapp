import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Layers, Pencil, Trash2, Plus } from 'lucide-react';
import { db } from '../../db/database';
import { createSubJob, renameSubJob, deleteSubJob } from '../../db/subJobRepository';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SubJob } from '../../models/SubJob';

function SubJobRow({ subJob }: { subJob: SubJob }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(subJob.name);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await renameSubJob(subJob.id, name.trim());
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li className="rounded-lg border border-border bg-muted/40 p-3">
        <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="min-w-40 flex-1" />
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
      <span className="font-medium text-foreground">{subJob.name}</span>
      <div className="ml-auto flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setName(subJob.name);
            setIsEditing(true);
          }}
          aria-label="Rename sub-job"
        >
          <Pencil className="size-3.5" />
        </Button>
        <ConfirmDeleteButton
          onConfirm={() => deleteSubJob(subJob.id, subJob.job_id)}
          title="Delete this sub-job?"
          description={`"${subJob.name}" will be removed. Any time and materials assigned to it are kept and move back to General.`}
          variant="ghost"
          size="icon-sm"
          aria-label="Delete sub-job"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </ConfirmDeleteButton>
      </div>
    </li>
  );
}

export function SubJobsPanel({ jobId }: { jobId: string }) {
  const subJobs = useLiveQuery(
    () => db.subJobs.where('job_id').equals(jobId).sortBy('created_at'),
    [jobId],
  );
  const [name, setName] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createSubJob({ job_id: jobId, name: name.trim() });
    setName('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="size-4.5 text-accent" />
          Sub-jobs
        </CardTitle>
        <CardDescription>
          Split a big job into sections (e.g. Bathroom, Kitchen). Time and materials can be assigned to a section, and
          the invoice lists each one separately.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
          <Input
            type="text"
            placeholder="Sub-job name (e.g. Bathroom)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-40 flex-1"
          />
          <Button type="submit" size="sm" variant="secondary" className="gap-1.5">
            <Plus className="size-4" />
            Add
          </Button>
        </form>

        <ul className="flex flex-col gap-2">
          {subJobs?.map((s) => <SubJobRow key={s.id} subJob={s} />)}
          {subJobs?.length === 0 && (
            <li className="text-sm text-muted-foreground">No sub-jobs - everything is invoiced as one job.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
