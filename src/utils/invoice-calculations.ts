// src/utils/invoice-calculations.ts

export type InvoiceItemCalc = {
  quantity: number;   // ex: 2
  unitPrice: number;  // ex: 100
  vatRate?: number;   // ex: 23 (percent), opcional
  discount?: number;  // ex: 10 (percent), opcional
};

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function calcLineSubtotal(item: InvoiceItemCalc): number {
  const qty = n(item.quantity);
  const unit = n(item.unitPrice);
  const discountPct = n(item.discount);
  const gross = qty * unit;
  const discount = gross * (discountPct / 100);
  return Math.max(0, gross - discount);
}

export function calcTotals(items: InvoiceItemCalc[]) {
  const subtotal = items.reduce((acc, it) => acc + calcLineSubtotal(it), 0);

  const vatTotal = items.reduce((acc, it) => {
    const rate = n(it.vatRate);
    const base = calcLineSubtotal(it);
    return acc + base * (rate / 100);
  }, 0);

  const total = subtotal + vatTotal;

  return {
    subtotal,
    vatTotal,
    total,
  };
}
