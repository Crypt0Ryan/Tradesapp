const STORAGE_KEY = 'tradesapp_business_settings';

export interface BusinessSettings {
  businessName: string;
  abn: string;
}

const DEFAULTS: BusinessSettings = { businessName: '', abn: '' };

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
