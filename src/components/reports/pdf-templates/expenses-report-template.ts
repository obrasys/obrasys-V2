import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { generateCoverPage } from "./base-template";
import { Expense } from "@/schemas/invoicing-schema";

export const generateExpensesReportContent = (reportData: any, companyName: string, currentDate: string) => {
  const { expenses, period } = reportData;
  const totalExpenses = expenses.reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
  const totalPaidExpenses = expenses.filter((exp: Expense) => exp.status === "paid").reduce((sum: number, exp: Expense) => sum + exp.amount, 0);
  const totalPendingExpenses = expenses.filter((exp: Expense) => exp.status === "pending" || exp.status === "overdue").reduce((sum: number, exp: Expense) => sum + exp.amount, 0);

  return `
    ${generateCoverPage("Relatório de Despesas", companyName, `Período: ${period}`)}

    <h1>Relatório de Despesas</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Período:</strong> ${period}</p>
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
            ${expenses.map((exp: Expense) => `
              <tr>
                <td>${exp.supplier_name}</td>
                <td>${exp.description}</td>
                <td style="text-align: right;">${formatCurrency(exp.amount)}</td>
                <td>${exp.status.replace('_', ' ')}</td>
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