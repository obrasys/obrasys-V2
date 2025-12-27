import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { formatCurrency } from "@/utils/formatters";
import { generateCoverPage } from "./base-template";

export const generateMonthlyFinancialReportContent = (reportData: any, companyName: string, currentDate: string) => {
  const { totalRevenue, totalExpenses, profitLoss, prevMonthComparison, revenueBySource, expensesByCategory, monthYear, period } = reportData;
  const financialResponsible = "João Silva"; // Placeholder for now

  return `
    ${generateCoverPage("Relatório Financeiro Mensal", companyName, `Mês / Ano: ${format(parseISO(monthYear), "MMMM yyyy", { locale: pt })}`)}

    <h1>Relatório Financeiro Mensal</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Mês / Ano:</strong> ${format(parseISO(monthYear), "MMMM yyyy", { locale: pt })}</p>
    </div>

    <h2>Resumo Executivo</h2>
    <div class="summary">
        <p><strong>Receita total do mês:</strong> ${formatCurrency(totalRevenue)}</p>
        <p><strong>Despesas totais:</strong> ${formatCurrency(totalExpenses)}</p>
        <p><strong>Resultado (Lucro / Prejuízo):</strong> ${formatCurrency(profitLoss)} (${profitLoss >= 0 ? 'Lucro' : 'Prejuízo'})</p>
        <p><strong>Comparação com mês anterior:</strong> ${prevMonthComparison.toFixed(1)}%</p>
    </div>

    <h2>Receitas</h2>
    <table>
        <thead>
            <tr>
                <th>Fonte</th>
                <th style="text-align: right;">Valor (€)</th>
                <th style="text-align: right;">%</th>
            </tr>
        </thead>
        <tbody>
            ${revenueBySource.map((item: any) => `
              <tr><td>${item.source}</td><td style="text-align: right;">${formatCurrency(item.value)}</td><td style="text-align: right;">${item.percentage.toFixed(1)}%</td></tr>
            `).join('')}
            <tr><td><strong>Total</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalRevenue)}</strong></td><td style="text-align: right;"><strong>100%</strong></td></tr>
        </tbody>
    </table>

    <h2>Despesas</h2>
    <table>
        <thead>
            <tr>
                <th>Categoria</th>
                <th style="text-align: right;">Valor (€)</th>
            </tr>
        </thead>
        <tbody>
            ${expensesByCategory.map((item: any) => `
              <tr><td>${item.category}</td><td style="text-align: right;">${formatCurrency(item.value)}</td></tr>
            `).join('')}
            <tr><td><strong>Total</strong></td><td style="text-align: right;"><strong>${formatCurrency(totalExpenses)}</strong></td></tr>
        </tbody>
    </table>

    <h2>Resultado Financeiro</h2>
    <div class="summary">
        <p><strong>Lucro bruto:</strong> ${formatCurrency(totalRevenue - totalExpenses)}</p>
        <p><strong>Lucro líquido:</strong> ${formatCurrency(profitLoss)}</p>
        <p><strong>Margem (%):</strong> ${totalRevenue > 0 ? ((profitLoss / totalRevenue) * 100).toFixed(1) : 0}%</p>
    </div>

    <h2>Observações</h2>
    <p>
        <ul>
            <li>Custos fora do padrão: N/A</li>
            <li>Receitas extraordinárias: N/A</li>
            <li>Alertas: N/A</li>
        </ul>
    </p>
  `;
};