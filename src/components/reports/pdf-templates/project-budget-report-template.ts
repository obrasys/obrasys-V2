import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { generateCoverPage } from "./base-template";
import { BudgetItemDB } from "@/schemas/budget-schema";

export const generateProjectBudgetReportContent = (reportData: any, companyName: string, currentDate: string) => {
  const { project, budget, budgetItems, period } = reportData;
  const projectName = project?.nome || 'N/A';
  const clientName = project?.client_name || 'N/A';
  const totalBudgeted = budget?.total_planeado || 0;
  const totalExecuted = budget?.total_executado || 0;
  const deviation = totalExecuted - totalBudgeted;
  const deviationPercentage = totalBudgeted > 0 ? (deviation / totalBudgeted) * 100 : 0;

  return `
    ${generateCoverPage("Relatório de Orçamento da Obra", companyName, `Projeto: ${projectName}<br>Período: ${period}`)}

    <h1>Relatório de Orçamento da Obra</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Projeto / Obra:</strong> ${projectName}</p>
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Período:</strong> ${period}</p>
    </div>
    <h2>Comparativo de Orçamento (Planeado vs Real)</h2>
    <table>
        <thead>
            <tr>
                <th>Serviço / Item</th>
                <th style="text-align: right;">Qtd.</th>
                <th>Un.</th>
                <th style="text-align: right;">Preço Unit.</th>
                <th style="text-align: right;">Custo Planeado</th>
                <th style="text-align: right;">Custo Executado</th>
                <th style="text-align: right;">Desvio (€)</th>
            </tr>
        </thead>
        <tbody>
            ${budgetItems.map((item: BudgetItemDB) => `
              <tr>
                <td>${item.servico}</td>
                <td style="text-align: right;">${item.quantidade}</td>
                <td>${item.unidade}</td>
                <td style="text-align: right;">${formatCurrency(item.preco_unitario)}</td>
                <td style="text-align: right;">${formatCurrency(item.custo_planeado)}</td>
                <td style="text-align: right;">${formatCurrency(item.custo_executado)}</td>
                <td style="text-align: right;">${formatCurrency(item.custo_executado - item.custo_planeado)}</td>
              </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="summary">
        <p><strong>Orçamento Total:</strong> ${formatCurrency(totalBudgeted)}</p>
        <p><strong>Custo Executado:</strong> ${formatCurrency(totalExecuted)}</p>
        <p><strong>Desvio Total:</strong> ${formatCurrency(deviation)} (${deviationPercentage.toFixed(1)}%)</p>
    </div>
  `;
};