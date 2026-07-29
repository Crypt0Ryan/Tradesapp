export function materialLineTotal(quantity: number, unitCost: number, markupPct: number): number {
  return quantity * unitCost * (1 + markupPct / 100);
}
