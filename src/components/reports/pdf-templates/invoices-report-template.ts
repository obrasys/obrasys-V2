import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { generateCoverPage } from "./base-template";
import { InvoiceWithRelations } from "@/schemas/invoicing-schema";

export const generateInvoicesReportContent = (reportData: any, companyName: string, currentDate: string) => {
  const { invoices, period } = reportData;
  const totalInvoiced = invoices.reduce((sum: number, inv: InvoiceWithRelations) => sum + inv.total_amount, 0);
  const totalPaidInvoices = invoices.reduce((sum: number, inv: InvoiceWithRelations) => sum + (inv.paid_amount || 0), 0);
  const totalPendingInvoices = totalInvoiced - totalPaidInvoices;

  return `
    ${generateCoverPage("Relatório de Faturas", companyName, `Período: ${period}`)}

    <h1>Relatório de Faturas</h1>
    <div class="header-info">
        <p><strong>Data de Geração:</strong> ${currentDate}</p>
        <p><strong>Empresa:</strong> ${companyName}</p>
        <p><strong>Período:</strong> ${period}</p>
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
            ${invoices.map((inv: InvoiceWithRelations) => `
              <tr>
                <td>${inv.invoice_number}</td>
                <td>${inv.clients?.nome || 'N/A'}</td>
                <td style="text-align: right;">${formatCurrency(inv.total_amount)}</td>
                <td style="text-align: right;">${formatCurrency(inv.paid_amount || 0)}</td>
                <td>${inv.status.replace('_', ' ')}</td>
                <td>${format(parseISO(inv.due_date), "dd/MM/yyyy")}</td>
              </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="summary">
        <p><strong>Total Faturado:</strong> ${formatCurrency(totalInvoiced)}</p>
        <p><strong>Total Recebido:</strong> ${formatCurrency(totalPaidInvoices)}</p>
        <p><strong>Total Pendente:</strong> ${formatCurrency(totalPendingInvoices)}</p>
    </div>
  `;
};