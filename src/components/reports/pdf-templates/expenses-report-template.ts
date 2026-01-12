import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { generateCoverPage } from "./base-template";
import { Expense } from "@/schemas/invoicing-schema";

export const generateExpensesReportContent = (reportData: any, companyName: string, currentDate: string) => {
  const { expenses, period } = reportData;
  const list: Expense[] = Array.isArray(expenses) ? expenses as Expense[] : [];

  const safeNumber = (n: unknown) => {
    const v = typeof n === "number" ? n : Number(n);
    return Number.isFinite(v) ? v : 0;
  };
  const safeText = (t: unknown) => String(t ?? "");

  const totalExpenses = list.reduce((sum: number, exp: Expense) => sum + safeNumber(exp.amount), 0);
  const totalPaidExpenses = list.filter((exp: Expense) => exp.status === "paid").reduce((sum: number, exp: Expense) => sum + safeNumber(exp.amount), 0);
  const totalPendingExpenses = list.filter((exp: Expense) => exp.status === "pending" || exp.status === "overdue").reduce((sum: number, exp: Expense) => sum + safeNumber(exp.amount), 0);

  return `
    ${generateCoverPage("Relatório de Despesas", companyName, `Período: ${safeText(period)}`)}

    <h1>Relatório de Despesas</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Período:</strong> ${safeText(period)}</p>
    </div>
    <h2>Análise Detalhada das Despesas</h2>
    <table>
        <thead>
            <tr>
                <th>Fornecedor</th>
                <th>Descrição</th>
                <th style="text-align: right;">Valor</th>
                <th>Estado</th>
                <th>Data Vencimento</th>
            </tr>
        </thead>
        <tbody>
            ${list.map((exp: Expense) => `
              <tr>
                <td>${safeText(exp.supplier_name)}</td>
                <td>${safeText(exp.description)}</td>
                <td style="text-align: right;">${formatCurrency(safeNumber(exp.amount))}</td>
                <td>${safeText(exp.status).replace('_', ' ')}</td>
                <td>${format(parseISO(exp.due_date), "dd/MM/yyyy")}</td>
              </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="summary">
        <p><strong>Total de Despesas:</strong> ${formatCurrency(totalExpenses)}</p>
        <p><strong>Total Pago:</strong> ${formatCurrency(totalPaidExpenses)}</p>
        <p><strong>Total Pendente:</strong> ${formatCurrency(totalPendingExpenses)}</p>
    </div>
  `;
};