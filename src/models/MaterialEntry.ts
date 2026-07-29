export type MaterialEntrySource = 'manual' | 'receipt_ocr';

export interface MaterialEntry {
  id: string;
  job_id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  markup_pct: number;
  source: MaterialEntrySource;
  receipt_id: string | null;
}

export type NewMaterialEntry = Omit<MaterialEntry, 'id'>;
