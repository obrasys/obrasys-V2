// src/utils/invoice-calculations.ts

const n = (v: unknown) =>
  Number.isFinite(Number(v)) ? Number(v) : 0;

export function calculateInvoiceFiscal(
  subtotal: number,
  vatRate: number,
  withholdingRate: number
) {
  const base = n(subtotal);

  const vatAmount = base * (n(vatRate) / 100);
  const withholdingAmount =
    base * (n(withholdingRate) / 100);

  const totalToReceive =
    base + vatAmount - withholdingAmount;

  return {
    subtotal: base,
    vatAmount,
    withholdingAmount,
    totalToReceive,
  };
}
