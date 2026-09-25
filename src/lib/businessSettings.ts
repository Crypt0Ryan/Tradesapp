const STORAGE_KEY = 'tradesapp_business_settings';

export interface BusinessSettings {
  businessName: string;
  abn: string;
  /** $/km rate for costing work-related travel in reports - not pre-filled, since the correct rate (e.g. ATO cents-per-km) changes over time and varies by vehicle/method. */
  kmRate: number | null;

  // Billing details printed on invoices. All optional / blank by default.
  address: string;
  phone: string;
  email: string;
  bankAccountName: string;
  bsb: string;
  accountNumber: string;
  /** Days after the invoice date that payment is due; null = no due date shown unless set per invoice. */
  paymentTermsDays: number | null;
  /** Any extra payment wording, e.g. "Please use the invoice number as your payment reference." */
  paymentNotes: string;
}

const DEFAULTS: BusinessSettings = {
  businessName: '',
  abn: '',
  kmRate: null,
  address: '',
  phone: '',
  email: '',
  bankAccountName: '',
  bsb: '',
  accountNumber: '',
  paymentTermsDays: null,
  paymentNotes: '',
};

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
