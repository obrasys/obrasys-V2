import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { generateCoverPage } from "./base-template";
import { BudgetItemDB } from "@/schemas/budget-schema";
import { Invoice } from "@/schemas/invoicing-schema";
import { AiAlert } from "@/schemas/ai-alert-schema";

export const generateProjectFinancialReportContent = (reportData: any, companyName: string, currentDate: string) => {
  const { project, budget, budgetItems, projectInvoices, projectAlerts, period } = reportData;
  const projectName = project?.nome || 'N/A';
  const clientName = project?.client_name || 'N/A';

  const totalBudgeted = budget?.total_planeado || 0;
  const totalRealCost = budget?.total_executado || 0;
  const totalInvoiced = projectInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total_amount, 0);
  const totalPaidInvoices = projectInvoices.reduce((sum: number, inv: Invoice) => sum + (inv.paid_amount || 0), 0);
  const balanceToReceive = totalInvoiced - totalPaidInvoices;
  const profitLoss = totalInvoiced - totalRealCost;
  const margin = totalInvoiced > 0 ? (profitLoss / totalInvoiced) * 100 : 0;

  return `
    ${generateCoverPage("Relatório Financeiro por Projeto / Obra", companyName, `Projeto: ${projectName}<br>Período: ${period}`)}

    <h1>Relatório Financeiro por Projeto / Obra</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Projeto / Obra:</strong> ${projectName}</p>
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Período:</strong> ${period}</p>
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
            ${budgetItems.map((item: BudgetItemDB) => `
              <tr><td>${item.servico}</td><td style="text-align: right;">${formatCurrency(item.custo_planeado)}</td></tr>
            `).join('')}
            <tr><td><strong>Total Orçamento</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalBudgeted)}</strong></td></tr>
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
            <tr><td>Mão de Obra</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_planeado * (item.tipo === 'equipe' ? 1 : 0)), 0))}</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_real_mao_obra || 0), 0))}</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_real_mao_obra || 0) - (item.custo_planeado * (item.tipo === 'equipe' ? 1 : 0)), 0))}</td></tr>
            <tr><td>Materiais</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_planeado * (item.tipo === 'material' ? 1 : 0)), 0))}</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_real_material || 0), 0))}</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_real_material || 0) - (item.custo_planeado * (item.tipo === 'material' ? 1 : 0)), 0))}</td></tr>
            <tr><td>Serviços/Outros</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + (item.custo_planeado * (item.tipo === 'servico' ? 1 : 0)), 0))}</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + ((item.custo_executado || 0) - (item.custo_real_material || 0) - (item.custo_real_mao_obra || 0)), 0))}</td><td style="text-align: right;">${formatCurrency(budgetItems.reduce((sum: number, item: BudgetItemDB) => sum + ((item.custo_executado || 0) - (item.custo_real_material || 0) - (item.custo_real_mao_obra || 0)) - (item.custo_planeado * (item.tipo === 'servico' ? 1 : 0)), 0))}</td></tr>
            <tr><td><strong>Total Custos</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalBudgeted)}</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalRealCost)}</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalRealCost - totalBudgeted)}</strong></td></tr>
        </tbody>
    </table>

    <h2>Receita</h2>
    <div class="summary">
        <p><strong>Valor contratado:</strong> ${formatCurrency(totalBudgeted)}</p>
        <p><strong>Valores faturados:</strong> ${formatCurrency(totalInvoiced)}</p>
        <p><strong>Saldo a receber:</strong> ${formatCurrency(balanceToReceive)}</p>
    </div>

    <h2>Resultado da Obra</h2>
    <div class="summary">
        <p><strong>Lucro / Prejuízo:</strong> ${formatCurrency(profitLoss)} (${profitLoss >= 0 ? 'Lucro' : 'Prejuízo'})</p>
        <p><strong>Margem (%):</strong> ${margin.toFixed(2)}%</p>
    </div>

    <h2>Alertas</h2>
    <p>
        <ul>
            ${projectAlerts.length > 0 ? projectAlerts.map((alert: AiAlert) => `
              <li><span style="font-weight: bold; color: ${alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'orange' : 'blue'};">[${alert.severity?.toUpperCase()}]</span> ${alert.title}: ${alert.message}</li>
            `).join('') : '<li>Nenhum alerta crítico ou de aviso para este projeto.</li>'}
        </ul>
    </p>
  `;
};