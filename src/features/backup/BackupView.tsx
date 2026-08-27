import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { exportBackup, readBackupFile, restoreBackup, summarizeBackup, type BackupData } from '../../lib/backup';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function BackupView({ onClose }: { onClose: () => void }) {
  const [isExporting, setIsExporting] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [restoredAt, setRestoredAt] = useState<string | null>(null);

  async function handleExport() {
    setIsExporting(true);
    try {
      await exportBackup();
    } finally {
      setIsExporting(false);
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFileError(null);
    setRestoredAt(null);
    try {
      setPendingBackup(await readBackupFile(file));
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Could not read this file.');
    }
  }

  async function handleConfirmRestore() {
    if (!pendingBackup) return;
    await restoreBackup(pendingBackup);
    setPendingBackup(null);
    setRestoredAt(new Date().toISOString());
  }

  const summary = pendingBackup ? summarizeBackup(pendingBackup) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <Button type="button" variant="outline" onClick={onClose} className="w-fit gap-2">
        <X className="size-4" />
        Close
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Backup &amp; Restore</CardTitle>
          <CardDescription>
            Everything in this app lives only on this device, in this browser - there's no server copy. Download a
            backup regularly, especially before clearing browser data, switching phones, or reinstalling the app.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground">Download a backup</h3>
            <p className="text-sm text-muted-foreground">
              Saves every client and job, and everything logged against them, plus your business details, into one
              file - keep it somewhere safe (email it to yourself, save it to cloud storage, etc).
            </p>
            <Button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-fit gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Download className="size-4" />
              {isExporting ? 'Preparing…' : 'Download backup'}
            </Button>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
            <h3 className="font-semibold text-foreground">Restore from a backup</h3>
            <p className="text-sm text-muted-foreground">
              Loads a previously downloaded backup file. This replaces everything currently on this device - you'll
              be asked to confirm before anything changes.
            </p>
            <Input type="file" accept="application/json" onChange={handleFileSelected} className="max-w-sm" />
            {fileError && <p className="text-sm text-destructive">{fileError}</p>}
            {restoredAt && (
              <p className="text-sm font-medium text-success">
                Backup restored at {new Date(restoredAt).toLocaleTimeString()}. Reload the app to see it everywhere.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={pendingBackup !== null} onOpenChange={(open) => !open && setPendingBackup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this backup?</AlertDialogTitle>
            <AlertDialogDescription>
              {summary && pendingBackup && (
                <>
                  Exported {new Date(pendingBackup.exported_at).toLocaleString()} - contains {summary.clients} client(s),{' '}
                  {summary.jobs} job(s), {summary.timeEntries} time entries, {summary.materialEntries} materials,{' '}
                  {summary.travelEntries} trips, {summary.photos} photos, {summary.voiceNotes} voice notes,{' '}
                  {summary.receipts} receipts, and {summary.contractorLogs} contractor entries.
                  <br />
                  <br />
                  <strong>Restoring will permanently replace everything currently on this device</strong> with the
                  contents of this file. This can't be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRestore}
              className="bg-destructive! text-destructive-foreground! hover:bg-destructive/90!"
            >
              Restore &amp; replace everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
