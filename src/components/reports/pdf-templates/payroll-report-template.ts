import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { generateCoverPage } from "./base-template";

export const generatePayrollReportContent = (reportData: any, companyName: string, currentDate: string) => {
  const { payrollEntries, period } = reportData;
  const totalPayrollCost = payrollEntries.reduce((sum: number, entry: any) => sum + entry.amount, 0);
  const totalPaidPayroll = payrollEntries.filter((entry: any) => entry.status === "paid").reduce((sum: number, entry: any) => sum + entry.amount, 0);
  const totalPendingPayroll = payrollEntries.filter((entry: any) => entry.status === "pending" || entry.status === "processed").reduce((sum: number, entry: any) => sum + entry.amount, 0);

  return `
    ${generateCoverPage("Relatório de Folha de Pagamento", companyName, `Período: ${period}`)}

    <h1>Relatório de Folha de Pagamento</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Período:</strong> ${period}</p>
    </div>
    <h2>Custos de Mão de Obra</h2>
    <table>
        <thead>
            <tr>
                <th>Colaborador</th>
                <th>Obra</th>
                <th>Tipo</th>
                <th style="text-align: right;">Valor</th>
                <th>Data</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            ${payrollEntries.map((entry: any) => `
              <tr>
                <td>${entry.users?.first_name || 'N/A'} ${entry.users?.last_name || ''}</td>
                <td>${entry.projects?.nome || 'N/A'}</td>
                <td>${entry.type.replace('_', ' ')}</td>
                <td style="text-align: right;">${formatCurrency(entry.amount)}</td>
                <td>${format(parseISO(entry.entry_date), "dd/MM/yyyy")}</td>
                <td>${entry.status.replace('_', ' ')}</td>
              </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="summary">
        <p><strong>Custo Total de Mão de Obra:</strong> ${formatCurrency(totalPayrollCost)}</p>
        <p><strong>Total Pago:</strong> ${formatCurrency(totalPaidPayroll)}</p>
        <p><strong>Total Pendente/Processado:</strong> ${formatCurrency(totalPendingPayroll)}</p>
    </div>
  `;
};