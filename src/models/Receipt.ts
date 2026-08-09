export type ReceiptStatus = 'pending_review' | 'confirmed';

export interface ReceiptLineItem {
  description: string;
  amount: number;
}

export interface Receipt {
  id: string;
  job_id: string | null;
  image_url: string;
  vendor: string | null;
  date: string | null;
  total: number | null;
  line_items: ReceiptLineItem[];
  ocr_confidence: number | null;
  status: ReceiptStatus;
  created_at: string;
}

export type NewReceipt = Omit<Receipt, 'id'>;
