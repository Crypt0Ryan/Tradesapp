export type ReceiptStatus = 'pending_review' | 'confirmed';

export interface ReceiptLineItem {
  description: string;
  /** Line total as printed on the receipt. */
  amount: number;
  quantity?: number;
  unit_price?: number;
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
  /** The text the scanner read, kept so it can be re-parsed or inspected when parsing goes wrong. */
  raw_text?: string | null;
  /** GST amount printed on the receipt, if the scanner found it. */
  gst?: number | null;
  /**
   * Whether the printed prices already include GST (retail receipts) or GST is added on top
   * (trade tax invoices). null/unset = unknown, treated as included. Drives the ex-GST
   * conversion when items are added to a job's materials.
   */
  gst_included?: boolean | null;
  status: ReceiptStatus;
  created_at: string;
}

export type NewReceipt = Omit<Receipt, 'id'>;
