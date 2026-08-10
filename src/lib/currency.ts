/** Formats a dollar amount as "$12.34" or "-$12.34" (sign before the $, not "$-12.34"). */
export function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}
