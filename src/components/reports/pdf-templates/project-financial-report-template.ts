// src/pdfs/templates/project-financial-report-template.ts
// ✅ Project Financial Report (HTML content) — audited + production-safe
// - Escapes all user/content fields to prevent HTML injection
// - Defensive defaults for undefined/null arrays
// - Fixes invalid HTML (<ul> inside <p>)
// - Avoids repeated reduce() calls by precomputing totals
// - Keeps your existing integration style (generateCoverPage + formatCurrency)

import { format, parseISO, isValid } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { generateCoverPage } from "./base-template";
import { BudgetItemDB } from "@/schemas/budget-schema";
import { Invoice } from "@/schemas/invoicing-schema";
import { AiAlert } from "@/schemas/ai-alert-schema";

type PeriodInput =
  | string
  | { from?: string | null; to?: string | null }
  | { start?: string | null; end?: string | null }
  | null
  | undefined;

export type ProjectFinancialReportData = {
  project?: {
    nome?: string | null;
    name?: string | null;
    client_name?: string | null;
  } | null;
  budget?: {
    total_planeado?: number | null;
    total_executado?: number | null;
  } | null;
  budgetItems?: BudgetItemDB[] | null;
  projectInvoices?: Invoice[] | null;
  projectAlerts?: AiAlert[] | null;
  period?: PeriodInput;
};

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

  if (typeof period === "string") {
    // If it is already a human string (e.g. "Dez 2025"), keep it.
    // If it is ISO, format it.
    const maybe = parseISO(period);
    if (isValid(maybe)) return format(maybe, "dd/MM/yyyy");
    return period;
  }

  const from = (period as any).from ?? (period as any).start ?? null;
  const to = (period as any).to ?? (period as any).end ?? null;

  if (!from && !to) return "—";
  if (from && !to) return `${formatISODate(from)} → —`;
  if (!from && to) return `— → ${formatISODate(to)}`;
  return `${formatISODate(from)} → ${formatISODate(to)}`;
}

/**
 * Generates ONLY the report HTML content.
 * (Your pipeline likely wraps this in generateBasePdfTemplate elsewhere.)
 */
export const generateProjectFinancialReportContent = (
  reportData: ProjectFinancialReportData,
  companyName: string,
  currentDate: string,
) => {
  const project = reportData?.project ?? null;
  const budget = reportData?.budget ?? null;

  const budgetItems = safeArray(reportData?.budgetItems);
  const projectInvoices = safeArray(reportData?.projectInvoices);
  const projectAlerts = safeArray(reportData?.projectAlerts);

  const projectNameRaw = project?.nome ?? project?.name ?? "N/A";
  const clientNameRaw = project?.client_name ?? "N/A";
  const periodStrRaw = normalizePeriod(reportData?.period);

  // Numbers (safe)
  const totalBudgeted = safeNumber(budget?.total_planeado, 0);
  const totalRealCost = safeNumber(budget?.total_executado, 0);

  const totalInvoiced = projectInvoices.reduce(
    (sum, inv) => sum + safeNumber((inv as any)?.total_amount, 0),
    0,
  );
  const totalPaidInvoices = projectInvoices.reduce(
    (sum, inv) => sum + safeNumber((inv as any)?.paid_amount, 0),
    0,
  );

  const balanceToReceive = totalInvoiced - totalPaidInvoices;
  const profitLoss = totalInvoiced - totalRealCost;
  const margin = totalInvoiced > 0 ? (profitLoss / totalInvoiced) * 100 : 0;

  // Precompute category totals ONCE (performance + correctness)
  const budgetedLabor = budgetItems.reduce((sum, item) => {
    const tipo = (item as any)?.tipo;
    // Keep your existing rule: tipo === "equipe" counts as labor budget
    return sum + (tipo === "equipe" ? safeNumber((item as any)?.custo_planeado, 0) : 0);
  }, 0);

  const budgetedMaterials = budgetItems.reduce((sum, item) => {
    const tipo = (item as any)?.tipo;
    return sum + (tipo === "material" ? safeNumber((item as any)?.custo_planeado, 0) : 0);
  }, 0);

  const budgetedServices = budgetItems.reduce((sum, item) => {
    const tipo = (item as any)?.tipo;
    return sum + (tipo === "servico" ? safeNumber((item as any)?.custo_planeado, 0) : 0);
  }, 0);

  const realLabor = budgetItems.reduce(
    (sum, item) => sum + safeNumber((item as any)?.custo_real_mao_obra, 0),
    0,
  );

  const realMaterials = budgetItems.reduce(
    (sum, item) => sum + safeNumber((item as any)?.custo_real_material, 0),
    0,
  );

  // “Serviços/Outros” real = executed - labor - materials (per item, aggregated)
  const realServices = budgetItems.reduce((sum, item) => {
    const executed = safeNumber((item as any)?.custo_executado, 0);
    const mat = safeNumber((item as any)?.custo_real_material, 0);
    const lab = safeNumber((item as any)?.custo_real_mao_obra, 0);
    return sum + (executed - mat - lab);
  }, 0);

  // Escaped strings
  const companyNameEsc = escapeHtml(companyName || "—");
  const currentDateEsc = escapeHtml(currentDate || "—");
  const projectNameEsc = escapeHtml(projectNameRaw);
  const clientNameEsc = escapeHtml(clientNameRaw);
  const periodEsc = escapeHtml(periodStrRaw);

  const renderAlerts = () => {
    if (!projectAlerts.length) {
      return `<li>Nenhum alerta crítico ou de aviso para este projeto.</li>`;
    }

    return projectAlerts
      .slice(0, 50) // prevent extremely large HTML payload
      .map((alert) => {
        const sev = (alert as any)?.severity ?? "info";
        const title = (alert as any)?.title ?? "Alerta";
        const message = (alert as any)?.message ?? "";
        const sevUpper = String(sev).toUpperCase();

        const color =
          sev === "critical" ? "red" : sev === "warning" ? "orange" : "#00679d";

        return `
          <li>
            <span style="font-weight: bold; color: ${escapeHtml(color)};">[${escapeHtml(sevUpper)}]</span>
            ${escapeHtml(title)}: ${escapeHtml(message)}
          </li>
        `;
      })
      .join("");
  };

  const renderBudgetItemsRows = () => {
    if (!budgetItems.length) {
      return `<tr><td colspan="2">Sem itens de orçamento.</td></tr>`;
    }

    return budgetItems
      .slice(0, 300) // avoid insane page sizes
      .map((item) => {
        const servico = (item as any)?.servico ?? "—";
        const custoPlaneado = safeNumber((item as any)?.custo_planeado, 0);
        return `
          <tr>
            <td>${escapeHtml(servico)}</td>
            <td style="text-align: right;">${escapeHtml(formatCurrency(custoPlaneado))}</td>
          </tr>
        `;
      })
      .join("");
  };

  return `
    ${generateCoverPage(
      "Relatório Financeiro por Projeto / Obra",
      companyNameEsc,
      `Projeto: ${projectNameEsc}<br>Período: ${periodEsc}`,
    )}

    <h1>Relatório Financeiro por Projeto / Obra</h1>

    <div class="header-info">
      <p><strong>Data de Geração:</strong> ${currentDateEsc}</p>
      <p><strong>Empresa:</strong> ${companyNameEsc}</p>
      <p><strong>Projeto / Obra:</strong> ${projectNameEsc}</p>
      <p><strong>Cliente:</strong> ${clientNameEsc}</p>
      <p><strong>Período:</strong> ${periodEsc}</p>
    </div>

    <h2>Orçamento Previsto</h2>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: right;">Valor (€)</th>
        </tr>
      </thead>
      <tbody>
        ${renderBudgetItemsRows()}
        <tr>
          <td><strong>Total Orçamento</strong></td>
          <td style="text-align: right;"><strong>${escapeHtml(formatCurrency(totalBudgeted))}</strong></td>
        </tr>
      </tbody>
    </table>

    <h2>Custos Reais</h2>
    <table>
      <thead>
        <tr>
          <th>Categoria</th>
          <th style="text-align: right;">Previsto (€)</th>
          <th style="text-align: right;">Real (€)</th>
          <th style="text-align: right;">Diferença (€)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Mão de Obra</td>
          <td style="text-align: right;">${escapeHtml(formatCurrency(budgetedLabor))}</td>
          <td style="text-align: right;">${escapeHtml(formatCurrency(realLabor))}</td>
          <td style="text-align: right;">${escapeHtml(formatCurrency(realLabor - budgetedLabor))}</td>
        </tr>

        <tr>
          <td>Materiais</td>
          <td style="text-align: right;">${escapeHtml(formatCurrency(budgetedMaterials))}</td>
          <td style="text-align: right;">${escapeHtml(formatCurrency(realMaterials))}</td>
          <td style="text-align: right;">${escapeHtml(formatCurrency(realMaterials - budgetedMaterials))}</td>
        </tr>

        <tr>
          <td>Serviços/Outros</td>
          <td style="text-align: right;">${escapeHtml(formatCurrency(budgetedServices))}</td>
          <td style="text-align: right;">${escapeHtml(formatCurrency(realServices))}</td>
          <td style="text-align: right;">${escapeHtml(formatCurrency(realServices - budgetedServices))}</td>
        </tr>

        <tr>
          <td><strong>Total Custos</strong></td>
          <td style="text-align: right;"><strong>${escapeHtml(formatCurrency(totalBudgeted))}</strong></td>
          <td style="text-align: right;"><strong>${escapeHtml(formatCurrency(totalRealCost))}</strong></td>
          <td style="text-align: right;"><strong>${escapeHtml(formatCurrency(totalRealCost - totalBudgeted))}</strong></td>
        </tr>
      </tbody>
    </table>

    <h2>Receita</h2>
    <div class="summary">
      <p><strong>Valor contratado:</strong> ${escapeHtml(formatCurrency(totalBudgeted))}</p>
      <p><strong>Valores faturados:</strong> ${escapeHtml(formatCurrency(totalInvoiced))}</p>
      <p><strong>Saldo a receber:</strong> ${escapeHtml(formatCurrency(balanceToReceive))}</p>
      <p><strong>Total pago:</strong> ${escapeHtml(formatCurrency(totalPaidInvoices))}</p>
    </div>

    <h2>Resultado da Obra</h2>
    <div class="summary">
      <p><strong>Lucro / Prejuízo:</strong> ${escapeHtml(formatCurrency(profitLoss))} (${profitLoss >= 0 ? "Lucro" : "Prejuízo"})</p>
      <p><strong>Margem (%):</strong> ${escapeHtml(margin.toFixed(2))}%</p>
    </div>

    <h2>Alertas</h2>
    <ul>
      ${renderAlerts()}
    </ul>
  `;
};
