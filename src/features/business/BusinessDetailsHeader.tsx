import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { getBusinessSettings, saveBusinessSettings, type BusinessSettings } from '../../lib/businessSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/FormField';

/**
 * Your business name/ABN/contact block, shown at the top of invoices and reports,
 * with an inline editor for those plus the billing (bank/payment) details that
 * print on invoices. Stored in localStorage - it's one settings blob, not app data.
 */
export function BusinessDetailsHeader({ onSaved }: { onSaved?: (settings: BusinessSettings) => void }) {
  const [settings, setSettings] = useState(getBusinessSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    ...settings,
    kmRate: settings.kmRate?.toString() ?? '',
    paymentTermsDays: settings.paymentTermsDays?.toString() ?? '',
  });

  function startEdit() {
    setDraft({
      ...settings,
      kmRate: settings.kmRate?.toString() ?? '',
      paymentTermsDays: settings.paymentTermsDays?.toString() ?? '',
    });
    setIsEditing(true);
  }

  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const updated: BusinessSettings = {
      businessName: draft.businessName.trim(),
      abn: draft.abn.trim(),
      address: draft.address.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
      bankAccountName: draft.bankAccountName.trim(),
      bsb: draft.bsb.trim(),
      accountNumber: draft.accountNumber.trim(),
      paymentNotes: draft.paymentNotes.trim(),
      paymentTermsDays: draft.paymentTermsDays === '' ? null : Number(draft.paymentTermsDays),
      kmRate: draft.kmRate === '' ? null : Number(draft.kmRate),
    };
    saveBusinessSettings(updated);
    setSettings(updated);
    setIsEditing(false);
    onSaved?.(updated);
  }

  if (isEditing) {
    return (
      <form
        onSubmit={handleSave}
        className="no-print flex w-full flex-col gap-4 rounded-lg border border-dashed border-border p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Business name">
            <Input value={draft.businessName} onChange={(e) => set('businessName', e.target.value)} />
          </FormField>
          <FormField label="ABN">
            <Input value={draft.abn} onChange={(e) => set('abn', e.target.value)} />
          </FormField>
          <FormField label="Address">
            <Textarea rows={2} value={draft.address} onChange={(e) => set('address', e.target.value)} />
          </FormField>
          <div className="flex flex-col gap-3">
            <FormField label="Phone">
              <Input type="tel" value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <h3 className="text-sm font-semibold text-foreground">Payment details (shown on invoices)</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Account name">
              <Input value={draft.bankAccountName} onChange={(e) => set('bankAccountName', e.target.value)} />
            </FormField>
            <FormField label="BSB">
              <Input
                inputMode="numeric"
                placeholder="000-000"
                value={draft.bsb}
                onChange={(e) => set('bsb', e.target.value)}
              />
            </FormField>
            <FormField label="Account number">
              <Input inputMode="numeric" value={draft.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} />
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Payment terms (days)" hint="Due date = invoice date + this. Leave blank for no due date.">
              <Input
                type="number"
                min="0"
                step="1"
                value={draft.paymentTermsDays}
                onChange={(e) => set('paymentTermsDays', e.target.value)}
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Payment notes" hint="e.g. Please use the invoice number as your payment reference.">
                <Input value={draft.paymentNotes} onChange={(e) => set('paymentNotes', e.target.value)} />
              </FormField>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <FormField label="$/km rate (optional)" hint="Used to cost work travel in reports - not printed on invoices.">
            <Input
              type="number"
              min="0"
              step="any"
              value={draft.kmRate}
              onChange={(e) => set('kmRate', e.target.value)}
              className="w-40"
            />
          </FormField>
        </div>

        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="text-sm">
        <p className="text-base font-semibold text-foreground">{settings.businessName || 'Your Business Name'}</p>
        {settings.abn && <p className="text-muted-foreground">ABN: {settings.abn}</p>}
        {settings.address && <p className="whitespace-pre-line text-muted-foreground">{settings.address}</p>}
        {settings.phone && <p className="text-muted-foreground">{settings.phone}</p>}
        {settings.email && <p className="text-muted-foreground">{settings.email}</p>}
      </div>
      <Button type="button" variant="ghost" size="sm" className="no-print gap-1.5" onClick={startEdit}>
        <Pencil className="size-3.5" />
        Edit business &amp; billing details
      </Button>
    </div>
  );
}
