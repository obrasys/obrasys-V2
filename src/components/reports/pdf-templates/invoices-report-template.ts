// reports/pdf-templates/invoices-report-template.ts
// ✅ Seguro | ✅ Produção | ✅ Compatível com base-template.ts

import { format, parseISO, isValid } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { generateCoverPage } from "./base-template";
import { InvoiceWithRelations } from "@/schemas/invoicing-schema";

/* =========================
   TYPES
========================= */

type PeriodInput =
  | string
  | { from?: string | null; to?: string | null }
  | { start?: string | null; end?: string | null }
  | null
  | undefined;

export type InvoicesReportData = {
  invoices?: InvoiceWithRelations[] | null;
  period?: PeriodInput;
};

/* =========================
   HELPERS
========================= */

function escapeHtml(input: unknown): string {
  const s = String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeNumber(n: unknown, fallback = 0): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function safeArray<T>(v: T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : [];
}

function formatISODate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseISO(iso);
  if (!isValid(d)) return "—";
  return format(d, "dd/MM/yyyy");
}

function normalizePeriod(period: PeriodInput): string {
  if (!period) return "—";

  if (typeof period === "string") return period;

  const from = (period as any).from ?? (period as any).start ?? null;
  const to = (period as any).to ?? (period as any).end ?? null;

  if (!from && !to) return "—";
  if (from && !to) return `${formatISODate(from)} → —`;
  if (!from && to) return `— → ${formatISODate(to)}`;
  return `${formatISODate(from)} → ${formatISODate(to)}`;
}

function formatInvoiceStatus(status?: string | null): string {
  if (!status) return "—";
  return status.replace(/_/g, " ");
}

/* =========================
   TEMPLATE
========================= */

export const generateInvoicesReportContent = (
  reportData: InvoicesReportData,
  companyName: string,
  currentDate: string,
) => {
  const invoices = safeArray(reportData?.invoices);
  const periodStr = normalizePeriod(reportData?.period);

  // Totais
  const totalInvoiced = invoices.reduce(
    (sum, inv) => sum + safeNumber(inv.total_amount),
    0,
  );

  const totalPaid = invoices.reduce(
    (sum, inv) => sum + safeNumber(inv.paid_amount),
    0,
  );

  const totalPending = totalInvoiced - totalPaid;

  const renderInvoiceRows = () => {
    if (!invoices.length) {
      return `
        <tr>
          <td colspan="6">Nenhuma fatura encontrada para o período selecionado.</td>
        </tr>
      `;
    }

    return invoices
      .slice(0, 500) // proteção contra PDFs gigantes
      .map((inv) => {
        const invoiceNumber = inv.invoice_number ?? "—";
        const clientName = inv.clients?.nome ?? "N/A";
        const totalAmount = safeNumber(inv.total_amount);
        const paidAmount = safeNumber(inv.paid_amount);
        const status = formatInvoiceStatus(inv.status);
        const dueDate = formatISODate(inv.due_date);

        return `
          <tr>
            <td>${escapeHtml(invoiceNumber)}</td>
            <td>${escapeHtml(clientName)}</td>
            <td style="text-align: right;">${escapeHtml(formatCurrency(totalAmount))}</td>
            <td style="text-align: right;">${escapeHtml(formatCurrency(paidAmount))}</td>
            <td>${escapeHtml(status)}</td>
            <td>${escapeHtml(dueDate)}</td>
          </tr>
        `;
      })
      .join("");
  };

  return `
    ${generateCoverPage(
      "Relatório de Faturas",
      escapeHtml(companyName),
      `Período: ${escapeHtml(periodStr)}`,
    )}

    <h1>Relatório de Faturas</h1>

    <div class="header-info">
      <p><strong>Data de Geração:</strong> ${escapeHtml(currentDate)}</p>
      <p><strong>Empresa:</strong> ${escapeHtml(companyName)}</p>
      <p><strong>Período:</strong> ${escapeHtml(periodStr)}</p>
    </div>

    <h2>Visão Geral das Faturas</h2>

    <table>
      <thead>
        <tr>
          <th>Nº Fatura</th>
          <th>Cliente</th>
          <th style="text-align: right;">Valor Total</th>
          <th style="text-align: right;">Valor Pago</th>
          <th>Estado</th>
          <th>Data Vencimento</th>
        </tr>
      </thead>
      <tbody>
        ${renderInvoiceRows()}
      </tbody>
    </table>

    <div class="summary">
      <p><strong>Total Faturado:</strong> ${escapeHtml(formatCurrency(totalInvoiced))}</p>
      <p><strong>Total Recebido:</strong> ${escapeHtml(formatCurrency(totalPaid))}</p>
      <p><strong>Total Pendente:</strong> ${escapeHtml(formatCurrency(totalPending))}</p>
    </div>
  `;
};
