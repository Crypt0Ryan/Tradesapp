/**
 * Turns OCR output from a receipt/tax invoice into vendor, date, totals and
 * purchased line items. Pure text processing (no OCR, no DOM) so it can be
 * exercised in isolation. It's heuristics, not understanding - callers must
 * treat every result as a guess for the user to check.
 */

export interface ParsedReceiptItem {
  description: string;
  /** Line total as printed on the receipt. */
  amount: number;
  quantity?: number;
  unit_price?: number;
}

export interface ParsedReceipt {
  vendor: string | null;
  /** YYYY-MM-DD */
  date: string | null;
  total: number | null;
  subtotal: number | null;
  gst: number | null;
  /**
   * true  = the printed prices already include GST (typical retail receipt),
   * false = prices are ex-GST with GST added on top (typical trade tax invoice),
   * null  = the receipt didn't give enough to tell.
   */
  gstIncluded: boolean | null;
  items: ParsedReceiptItem[];
  itemsSum: number;
}

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

/** A line of words as the OCR engine grouped them along a (possibly slanted) baseline. */
export interface OcrLine {
  words: OcrWord[];
  bbox: { x0: number; y0: number; x1: number; y1: number };
  baseline?: { x0: number; y0: number; x1: number; y1: number };
}

/* ------------------------------------------------------------------ rows */

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
};

/** How much the text slopes across the page (rise over run, y pointing down): 0 = level. Median of the long lines' baselines. */
export function skewSlope(lines: OcrLine[]): number {
  const slopes = lines
    .filter((l) => l.baseline && l.baseline.x1 - l.baseline.x0 > 150)
    .map((l) => (l.baseline!.y1 - l.baseline!.y0) / (l.baseline!.x1 - l.baseline!.x0));
  return slopes.length >= 2 ? median(slopes) : 0;
}

/**
 * Rebuilds visual text rows from the engine's lines. Two things go wrong if you
 * just trust vertical position: OCR engines often split a wide receipt into
 * separate blocks per column (all descriptions, then all prices), and a photo
 * taken at a slight angle makes the prices on the right sit lower than their
 * descriptions on the left. So: start from the engine's baseline-following
 * lines, work out the page's skew from those baselines, and only merge two
 * lines into one row if they line up *after* correcting for that skew.
 */
export function rowsFromLines(lines: OcrLine[]): string[] {
  const usable = lines
    .map((l) => ({ ...l, words: l.words.filter((w) => w.text.trim() !== '' && w.confidence >= 15) }))
    .filter((l) => l.words.length > 0);
  if (usable.length === 0) return [];

  const slope = skewSlope(usable);

  const allWords = usable.flatMap((l) => l.words);
  const wordHeight = median(allWords.map((w) => w.bbox.y1 - w.bbox.y0)) || 10;
  const charWidth =
    median(allWords.filter((w) => w.text.length > 1).map((w) => (w.bbox.x1 - w.bbox.x0) / w.text.length)) || wordHeight * 0.5;

  const pageCentreX = median(usable.map((l) => (l.bbox.x0 + l.bbox.x1) / 2));
  // Vertical position with the skew taken out, measured at the page's centre column.
  const level = (l: OcrLine) => (l.bbox.y0 + l.bbox.y1) / 2 - slope * ((l.bbox.x0 + l.bbox.x1) / 2 - pageCentreX);

  const ordered = [...usable].sort((a, b) => level(a) - level(b));
  const rows: { y: number; lines: typeof usable }[] = [];
  for (const line of ordered) {
    const row = rows[rows.length - 1];
    const sameHeight = row && Math.abs(level(line) - row.y) <= wordHeight * 0.5;
    // Two pieces of one row sit side by side; two different rows would overlap horizontally.
    const overlapsAlready = row?.lines.some((l) => line.bbox.x0 < l.bbox.x1 - charWidth && line.bbox.x1 > l.bbox.x0 + charWidth);
    if (row && sameHeight && !overlapsAlready) {
      row.lines.push(line);
      row.y = row.lines.reduce((sum, l) => sum + level(l), 0) / row.lines.length;
    } else {
      rows.push({ y: level(line), lines: [line] });
    }
  }

  return rows.map((row) => {
    const words = row.lines.flatMap((l) => l.words).sort((a, b) => a.bbox.x0 - b.bbox.x0);
    let text = '';
    words.forEach((w, i) => {
      if (i > 0) {
        const gap = w.bbox.x0 - words[i - 1].bbox.x1;
        text += gap > charWidth * 2.5 ? '   ' : ' ';
      }
      text += w.text.trim();
    });
    return text;
  });
}

/* ----------------------------------------------------------------- money */

interface MoneyMatch {
  value: number;
  start: number;
  end: number;
}

// 12.50  $12.50  $ 12.50  1,234.50  (a "." or "," decimal - OCR often confuses them)
const MONEY_RE = /(?<![\d.,])(-?)\$?\s?(\d{1,3}(?:,\d{3})+|\d{1,6})[.,](\d{2})(?![\d%a-zA-Z])/g;

function findMoney(line: string): MoneyMatch[] {
  const out: MoneyMatch[] = [];
  for (const m of line.matchAll(MONEY_RE)) {
    const whole = m[2].replace(/,/g, '');
    const value = Number(`${whole}.${m[3]}`) * (m[1] === '-' ? -1 : 1);
    out.push({ value, start: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
  }
  return out;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const approx = (a: number, b: number, tol = 0.06) => Math.abs(a - b) <= tol;

/* ------------------------------------------------------------ line kinds */

const SUBTOTAL_RE = /^\W*sub\s*-?\s*total\b/i;
const TOTAL_START_RE = /^\W*(grand\s+total|total|amount\s+due|balance\s+due|amount\s+payable|total\s+due|to\s+pay)\b/i;
const NOT_A_TOTAL_RE = /^\W*total\s+(gst|tax|saving|savings|items?|qty|quantity|discount|number|units?)\b/i;
const GST_LINE_RE = /^\W*(?:includes?\s+|incl\w*\s+|total\s+)?(?:gst|g\.s\.t\.?|tax)\b/i;
const PAYMENT_RE = /^\W*(eftpos|visa|mastercard|master\s*card|amex|american\s+express|cash|change|tendered|card|paid|payment|credit|debit|paywave|tap)\b/i;
const JUNK_RE =
  /^\W*(abn|acn|tel|ph|phone|fax|www|http|email|e-?mail|store|reg|register|terminal|cashier|operator|receipt|invoice|tax\s+invoice|date\s*[:\d]|time\s*[:\d]|thank|welcome|items?\s*:|customer|member|points|order|docket|trans|txn|page|please|return|refund|barcode|www)\b/i;
const HEADER_WORDS = ['code', 'description', 'desc', 'item', 'qty', 'quantity', 'price', 'unit', 'total', 'amount', 'gst', 'rate', 'disc', 'ext'];
const DISCOUNT_RE = /\b(discount|saving|savings|rounding|coupon|voucher|redeem|surcharge)\b/i;

function isColumnHeader(line: string): boolean {
  const words = line.toLowerCase().match(/[a-z]+/g) ?? [];
  return words.filter((w) => HEADER_WORDS.includes(w)).length >= 2 && findMoney(line).length === 0;
}

const DATE_LIKE_RE = /\b\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}\b|\b\d{1,2}:\d{2}\b/;
const PHONE_LIKE_RE = /\b0\d[\s-]?\d{3,4}[\s-]?\d{3,4}\b/;

/* ------------------------------------------------------------ line items */

interface LineAnalysis {
  /** Description text with amounts/qty removed. */
  text: string;
  /** Right-hand amounts, left to right. */
  amounts: number[];
  quantity?: number;
  unitPrice?: number;
  /** A "6 x $18.90" style line that carries no description of its own. */
  isQtyContinuation: boolean;
}

function stripItemCode(text: string): string {
  // Leading SKU/code like "R15CU", "BV20", "1234567" - only when real words follow it.
  const m = text.match(/^([A-Z0-9./-]*\d[A-Z0-9./-]*)\s+(.*)$/);
  if (m && m[1].length >= 4 && /[a-zA-Z]{3,}/.test(m[2])) return m[2];
  return text;
}

function cleanDescription(text: string): string {
  return stripItemCode(
    text
      .replace(/[|_~]+/g, ' ')
      .replace(/\s+[^a-zA-Z\s]*[)\]}!;][^a-zA-Z\s]*$/, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s\-–.:,*#]+|[\s\-–.:,*#]+$/g, '')
      .trim(),
  );
}

function analyseLine(rawLine: string): LineAnalysis | null {
  // A lone trailing letter after an amount is a tax-code flag (G, T, A ...), not part of the text.
  const line = rawLine.replace(/(\d[.,]\d{2})\s+[A-Za-z*#]\s*$/, '$1').trim();
  const money = findMoney(line);
  if (money.length === 0) return null;

  // The price columns are the run of amounts at the right-hand end of the line.
  let firstIdx = money.length - 1;
  while (firstIdx > 0) {
    const gap = line.slice(money[firstIdx - 1].end, money[firstIdx].start);
    if (/^\s*(?:[x@*]\s*)?$/i.test(gap)) firstIdx--;
    else break;
  }
  const group = money.slice(firstIdx).slice(-3);
  const amounts = group.map((g) => g.value);
  let leading = line.slice(0, group[0].start).trim();

  let quantity: number | undefined;
  let unitPrice: number | undefined;
  let isQtyContinuation = false;

  // "6 x $18.90    $113.40" / "2 @ $6.25" - a quantity line with no description of its own.
  const qtyLine = leading.match(/^(\d+(?:\.\d+)?)\s*[x@×]\s*$/i);
  if (qtyLine) {
    isQtyContinuation = true;
    quantity = Number(qtyLine[1]);
    unitPrice = amounts[0];
    leading = '';
  } else if (amounts.length >= 2) {
    // Table row: "<desc> <qty> <unit price> <line total>" - accept the qty only if the sums agree.
    const tail = leading.match(/^(.*?)(?:\s+|^)(\d+(?:\.\d+)?)\s*[x@×]?\s*$/i);
    const unit = amounts[amounts.length - 2];
    const lineTotal = amounts[amounts.length - 1];
    if (tail) {
      const q = Number(tail[2]);
      if (q > 0 && approx(q * unit, lineTotal, Math.max(0.06, lineTotal * 0.01))) {
        quantity = q;
        unitPrice = unit;
        leading = tail[1];
      }
    }
  }

  return { text: cleanDescription(leading), amounts, quantity, unitPrice, isQtyContinuation };
}

function parseItems(lines: string[], endIndex: number): ParsedReceiptItem[] {
  const items: ParsedReceiptItem[] = [];
  let pending: string | null = null;

  for (let i = 0; i < endIndex; i++) {
    const line = lines[i];
    if (JUNK_RE.test(line) || isColumnHeader(line) || DISCOUNT_RE.test(line)) {
      pending = null;
      continue;
    }

    const a = analyseLine(line);

    if (!a) {
      // Description with no price on it - the price is probably on the next line.
      const letters = (line.match(/[a-zA-Z]/g) ?? []).length;
      const looksLikeItem =
        letters >= 3 && letters / line.replace(/\s/g, '').length >= 0.5 && !DATE_LIKE_RE.test(line) && !PHONE_LIKE_RE.test(line);
      pending = looksLikeItem ? cleanDescription(line) : null;
      continue;
    }

    const lineTotal = a.amounts[a.amounts.length - 1];

    if (a.isQtyContinuation) {
      const last = items[items.length - 1];
      if (pending) {
        const amount = a.amounts.length >= 2 ? lineTotal : round2((a.quantity ?? 1) * (a.unitPrice ?? lineTotal));
        items.push({ description: pending, amount, quantity: a.quantity, unit_price: a.unitPrice });
        pending = null;
      } else if (last && a.quantity && a.unitPrice && approx(last.amount, a.quantity * a.unitPrice, 0.1)) {
        // "GALV SCREWS  12.50" followed by "2 @ 6.25" just explains the quantity.
        last.quantity = a.quantity;
        last.unit_price = a.unitPrice;
      }
      continue;
    }

    const hasWords = /[a-zA-Z]{2,}/.test(a.text);
    if (!hasWords) {
      // A bare price on its own line belongs to the description above it.
      if (pending && lineTotal > 0) {
        items.push({ description: pending, amount: lineTotal });
      }
      pending = null;
      continue;
    }

    if (lineTotal > 0 && lineTotal < 100000) {
      items.push({ description: a.text, amount: lineTotal, quantity: a.quantity, unit_price: a.unitPrice });
    }
    pending = null;
  }

  return items;
}

/* -------------------------------------------------------------- metadata */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function toIso(day: number, month: number, year: number): string | null {
  if (year < 100) year += 2000;
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseDate(lines: string[]): string | null {
  const candidates: string[] = [];
  const ordered = [...lines].sort((a, b) => Number(/\bdate\b/i.test(b)) - Number(/\bdate\b/i.test(a)));

  for (const line of ordered) {
    let m = line.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (m) {
      const iso = toIso(Number(m[3]), Number(m[2]), Number(m[1]));
      if (iso) candidates.push(iso);
    }
    m = line.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4}|\d{2})\b/);
    if (m) {
      const iso = toIso(Number(m[1]), Number(m[2]), Number(m[3]));
      if (iso) candidates.push(iso);
    }
    m = line.match(/\b(\d{1,2})(?:st|nd|rd|th)?[\s-]+([a-z]{3,9})\.?,?[\s-]+(\d{4}|\d{2})\b/i);
    if (m) {
      const month = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
      const iso = month > 0 ? toIso(Number(m[1]), month, Number(m[3])) : null;
      if (iso) candidates.push(iso);
    }
    m = line.match(/\b([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i);
    if (m) {
      const month = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1;
      const iso = month > 0 ? toIso(Number(m[2]), month, Number(m[3])) : null;
      if (iso) candidates.push(iso);
    }
    if (candidates.length > 0) break;
  }
  return candidates[0] ?? null;
}

const KNOWN_VENDORS = [
  'Bunnings Warehouse', 'Bunnings', 'Reece', 'Mitre 10', 'Total Tools', 'Sydney Tools', 'Tradelink', 'Blackwoods',
  'Supercheap Auto', 'Repco', 'Beaurepaires', 'Kennards', 'Hardware', 'Elecraft', 'Middy', 'Clipsal', 'Bathroom Warehouse',
  'Burson', 'Autobarn', 'Coates', 'Toolmart', 'Screwfix',
];

function titleCase(s: string): string {
  const letters = s.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 4 || letters !== letters.toUpperCase()) return s;
  return s.toLowerCase().replace(/(^|[\s&'-])([a-z])/g, (_, p: string, c: string) => p + c.toUpperCase());
}

export function parseVendor(lines: string[]): string | null {
  const head = lines.slice(0, 10);
  const joined = head.join(' ').toLowerCase();
  const known = KNOWN_VENDORS.find((v) => joined.includes(v.toLowerCase()));

  // "COMPANY NAME    TAX INVOICE" - keep the company, drop the document label (and anything after it).
  const withoutLabel = (line: string) =>
    line
      .replace(/^\W*welcome(\s+to)?\s+/i, '')
      .replace(/\s*\b(tax\s+invoice|invoice|receipt)\b.*$/i, '')
      .trim();

  const candidates = head
    .map(withoutLabel)
    .filter((l) => l !== '' && !JUNK_RE.test(l) && !isColumnHeader(l) && !DATE_LIKE_RE.test(l) && !PHONE_LIKE_RE.test(l))
    .filter((l) => {
      const letters = (l.match(/[a-zA-Z]/g) ?? []).length;
      return letters >= 3 && letters / l.replace(/\s/g, '').length >= 0.6 && findMoney(l).length === 0;
    });

  return candidates[0] ? titleCase(candidates[0]) : (known ?? null);
}

/* ------------------------------------------------------------ top level */

export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  let subtotal: number | null = null;
  let gst: number | null = null;
  const totalCandidates: number[] = [];
  const paymentAmounts: number[] = [];
  let endIndex = lines.length;

  lines.forEach((line, i) => {
    const money = findMoney(line);
    if (money.length === 0) return;
    const last = money[money.length - 1].value;
    let summary = true;

    if (SUBTOTAL_RE.test(line)) subtotal = last;
    else if (TOTAL_START_RE.test(line) && !NOT_A_TOTAL_RE.test(line)) totalCandidates.push(last);
    else if (GST_LINE_RE.test(line) && !JUNK_RE.test(line)) gst = gst ?? last;
    else if (PAYMENT_RE.test(line)) {
      if (!/^\W*(cash|change|tendered)/i.test(line)) paymentAmounts.push(last);
    } else summary = false;

    if (summary && i < endIndex) endIndex = i;
  });

  const items = parseItems(lines, endIndex);
  const itemsSum = round2(items.reduce((s, it) => s + it.amount, 0));

  let total: number | null = totalCandidates.length > 0 ? Math.max(...totalCandidates) : null;
  if (total === null && paymentAmounts.length > 0) total = Math.max(...paymentAmounts);
  if (total === null && subtotal !== null) total = round2(subtotal + (gst ?? 0));
  if (total === null && itemsSum > 0) total = itemsSum;

  let gstIncluded: boolean | null = null;
  if (gst !== null && total !== null) {
    if (subtotal !== null && approx(subtotal + gst, total, 0.06)) gstIncluded = false;
    else if (approx(total / 11, gst, 0.06)) gstIncluded = true;
    else if (approx(total / 10, gst, 0.06) && itemsSum > 0 && approx(itemsSum, total - gst, 0.1)) gstIncluded = false;
  } else if (gst === null && subtotal !== null && total !== null) {
    if (approx(total, subtotal * 1.1, 0.06)) gstIncluded = false;
    else if (approx(total, subtotal, 0.01)) gstIncluded = true;
  }

  return {
    vendor: parseVendor(lines),
    date: parseDate(lines),
    total,
    subtotal,
    gst,
    gstIncluded,
    items,
    itemsSum,
  };
}
