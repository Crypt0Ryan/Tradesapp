import { useState } from 'react';
import { getBusinessSettings, saveBusinessSettings } from '../../lib/businessSettings';

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
      <form onSubmit={handleSave} className="no-print">
        <input
          type="text"
          placeholder="Your business name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
        <input type="text" placeholder="ABN" value={abn} onChange={(e) => setAbn(e.target.value)} />
        <input
          type="number"
          min="0"
          step="any"
          placeholder="$/km rate (optional, for travel costing)"
          value={kmRate}
          onChange={(e) => setKmRate(e.target.value)}
        />
        <button type="submit">Save</button>
        <button type="button" onClick={() => setIsEditing(false)}>
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div>
      <strong>{settings.businessName || 'Your Business Name'}</strong>
      {settings.abn && <div>ABN: {settings.abn}</div>}
      <button type="button" className="no-print" onClick={startEdit}>
        Edit business details
      </button>
    </div>
  );
}
