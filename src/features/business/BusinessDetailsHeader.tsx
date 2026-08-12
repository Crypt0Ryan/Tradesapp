import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { getBusinessSettings, saveBusinessSettings } from '../../lib/businessSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function BusinessDetailsHeader() {
  const [settings, setSettings] = useState(getBusinessSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [abn, setAbn] = useState(settings.abn);
  const [kmRate, setKmRate] = useState(settings.kmRate?.toString() ?? '');

  function startEdit() {
    setBusinessName(settings.businessName);
    setAbn(settings.abn);
    setKmRate(settings.kmRate?.toString() ?? '');
    setIsEditing(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const updated = {
      businessName: businessName.trim(),
      abn: abn.trim(),
      kmRate: kmRate === '' ? null : Number(kmRate),
    };
    saveBusinessSettings(updated);
    setSettings(updated);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="no-print flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
        <Input
          type="text"
          placeholder="Your business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="min-w-40 flex-1"
        />
        <Input type="text" placeholder="ABN" value={abn} onChange={(e) => setAbn(e.target.value)} className="w-40" />
        <Input
          type="number"
          min="0"
          step="any"
          placeholder="$/km rate (optional)"
          value={kmRate}
          onChange={(e) => setKmRate(e.target.value)}
          className="w-40"
        />
        <Button type="submit" size="sm">
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="font-semibold text-foreground">{settings.businessName || 'Your Business Name'}</p>
        {settings.abn && <p className="text-sm text-muted-foreground">ABN: {settings.abn}</p>}
      </div>
      <Button type="button" variant="ghost" size="sm" className="no-print gap-1.5" onClick={startEdit}>
        <Pencil className="size-3.5" />
        Edit business details
      </Button>
    </div>
  );
}
