import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { generateCoverPage } from "./base-template";

export const generateCashFlowReportContent = (reportData: any, companyName: string, currentDate: string) => {
  const { initialBalance, totalEntries, totalExits, finalBalance, entries, exits, forecast, period } = reportData;
  const financialResponsible = "João Silva"; // Placeholder for now

  return `
    ${generateCoverPage("Relatório de Fluxo de Caixa", companyName, `Período: ${period}`)}

    <h1>Relatório de Fluxo de Caixa</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Período:</strong> ${period}</p>
    </div>

    <h2>Entradas</h2>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Origem</th>
                <th style="text-align: right;">Valor (€)</th>
            </tr>
        </thead>
        <tbody>
            ${entries.map((entry: any) => `
              <tr><td>${format(parseISO(entry.date), "dd/MM/yyyy")}</td><td>${entry.origin}</td><td style="text-align: right;">${formatCurrency(entry.amount)}</td></tr>
            `).join('')}
        </tbody>
    </table>

    <h2>Saídas</h2>
    <table>
        <thead>
            <tr>
                <th>Data</th>
                <th>Destino</th>
                <th style="text-align: right;">Valor (€)</th>
            </tr>
        </thead>
        <tbody>
            ${exits.map((exit: any) => `
              <tr><td>${format(parseISO(exit.date), "dd/MM/yyyy")}</td><td>${exit.destination}</td><td style="text-align: right;">${formatCurrency(exit.amount)}</td></tr>
            `).join('')}
        </tbody>
    </table>

    <h2>Resumo</h2>
    <div class="summary">
        <p><strong>Saldo inicial:</strong> ${formatCurrency(initialBalance)}</p>
        <p><strong>Total entradas:</strong> ${formatCurrency(totalEntries)}</p>
        <p><strong>Total saídas:</strong> ${formatCurrency(totalExits)}</p>
        <p><strong>Saldo final:</strong> ${formatCurrency(finalBalance)}</p>
    </div>

    <h2>Previsão Próximos 30/60/90 dias</h2>
    <table>
        <thead>
            <tr>
                <th>Período</th>
                <th style="text-align: right;">Saldo Previsto (€)</th>
            </tr>
        </thead>
        <tbody>
            <tr><td>Próximos 30 dias</td><td style="text-align: right;">${formatCurrency(forecast.next30Days)}</td></tr>
            <tr><td>Próximos 60 dias</td><td style="text-align: right;">${formatCurrency(forecast.next60Days)}</td></tr>
            <tr><td>Próximos 90 dias</td><td style="text-align: right;">${formatCurrency(forecast.next90Days)}</td></tr>
        </tbody>
    </table>
  `;
};