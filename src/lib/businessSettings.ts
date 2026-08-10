const STORAGE_KEY = 'tradesapp_business_settings';

export interface BusinessSettings {
  businessName: string;
  abn: string;
  /** $/km rate for costing work-related travel in reports - not pre-filled, since the correct rate (e.g. ATO cents-per-km) changes over time and varies by vehicle/method. */
  kmRate: number | null;
}

const DEFAULTS: BusinessSettings = { businessName: '', abn: '', kmRate: null };

export function getBusinessSettings(): BusinessSettings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function saveBusinessSettings(settings: BusinessSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
