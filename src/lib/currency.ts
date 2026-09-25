/** Formats a dollar amount as "$1,234.56" or "-$1,234.56" (sign before the $, not "$-12.34"). */
export function formatCurrency(amount: number): string {
  // Round to cents first so a tiny negative (e.g. -0.001) reads "$0.00", never "-$0.00".
  const cents = Math.round(amount * 100) / 100;
  const sign = cents < 0 ? '-' : '';
  const digits = Math.abs(cents).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}$${digits}`;
}
