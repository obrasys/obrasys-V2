"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  CheckCircle,
  DollarSign,
  XCircle,
  Clock,
  Edit,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { InvoiceWithRelations, InvoiceItem, Payment } from "@/schemas/invoicing-schema";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "@/components/SessionContextProvider";
import PaymentDialog from "./PaymentDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { v4 as uuidv4 } from "uuid"; // Import uuidv4
import { Company } from "@/schemas/profile-schema"; // Import Company schema

interface InvoiceDetailViewProps {
  invoice: InvoiceWithRelations;
  onInvoiceUpdated: () => void; // Callback to refresh parent list
  onEditInvoice: (invoice: InvoiceWithRelations) => void;
}

const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  onInvoiceUpdated,
  onEditInvoice,
}) => {
  const { user } = useSession();
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(true);
  const [isProcessingAction, setIsProcessingAction] = React.useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [invoiceItems, setInvoiceItems] = React.useState<InvoiceItem[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [companyData, setCompanyData] = React.useState<Company | null>(null); // NEW: State for company data

  const fetchInvoiceDetails = React.useCallback(async () => {
    setIsLoadingDetails(true);
    const [itemsRes, paymentsRes] = await Promise.all([
      supabase.from('invoice_items').select('*').eq('invoice_id', invoice.id),
      supabase.from('payments').select('*').eq('invoice_id', invoice.id).order('payment_date', { ascending: true }),
    ]);

    if (itemsRes.error) {
      toast.error(`Erro ao carregar itens da fatura: ${itemsRes.error.message}`);
      console.error("Erro ao carregar itens da fatura:", itemsRes.error);
    } else {
      setInvoiceItems(itemsRes.data || []);
    }

    if (paymentsRes.error) {
      toast.error(`Erro ao carregar pagamentos: ${paymentsRes.error.message}`);
      console.error("Erro ao carregar pagamentos:", paymentsRes.error);
    } else {
      setPayments(paymentsRes.data || []);
    }

    // NEW: Fetch company data
    if (invoice.company_id) {
      const { data: companyRes, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', invoice.company_id)
        .single();
      if (companyError) {
        console.error("Erro ao carregar dados da empresa para PDF:", companyError);
        setCompanyData(null);
      } else {
        setCompanyData(companyRes);
      }
    } else {
      setCompanyData(null);
    }

    setIsLoadingDetails(false);
  }, [invoice.id, invoice.company_id]);

  React.useEffect(() => {
    fetchInvoiceDetails();
  }, [fetchInvoiceDetails]);

  const handleRecordPayment = async (payment: Payment) => {
    if (!user || !invoice.company_id) {
      toast.error("Utilizador não autenticado ou ID da empresa em falta.");
      return;
    }
    setIsProcessingAction(true);
    try {
      const paymentDataToSave = {
        ...payment,
        company_id: invoice.company_id,
        invoice_id: invoice.id,
        id: uuidv4(),
      };

      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentDataToSave);

      if (paymentError) throw paymentError;

      const newPaidAmount = (invoice.paid_amount || 0) + payment.amount;
      let newStatus = invoice.status;
      if (newPaidAmount >= invoice.total_amount) {
        newStatus = "paid";
      } else if (newPaidAmount > 0 && newPaidAmount < invoice.total_amount) {
        newStatus = "pending"; // Still pending if partially paid
      }

      const { error: invoiceUpdateError } = await supabase
        .from('invoices')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);

      if (invoiceUpdateError) throw invoiceUpdateError;

      toast.success("Pagamento registado com sucesso!");
      setIsPaymentDialogOpen(false);
      onInvoiceUpdated(); // Refresh parent list and current invoice data
      fetchInvoiceDetails(); // Refresh local items and payments
    } catch (error: any) {
      toast.error(`Erro ao registar pagamento: ${error.message}`);
      console.error("Erro ao registar pagamento:", error);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleUpdateInvoiceStatus = async (newStatus: InvoiceWithRelations['status']) => {
    if (!user || !invoice.id) {
      toast.error("Utilizador não autenticado ou ID da fatura em falta.");
      return;
    }
    setIsProcessingAction(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', invoice.id);

      if (error) throw error;

      toast.success(`Estado da fatura atualizado para '${newStatus.replace('_', ' ')}'`);
      onInvoiceUpdated(); // Refresh parent list and current invoice data
    } catch (error: any) {
      toast.error(`Erro ao atualizar estado da fatura: ${error.message}`);
      console.error("Erro ao atualizar estado da fatura:", error);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getStatusBadge = (status: InvoiceWithRelations['status']) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
    let colorClass = "";
    let icon = null;

    switch (status) {
      case "pending":
        variant = "outline";
        colorClass = "border-orange-500 text-orange-600 dark:text-orange-400";
        icon = <Clock className="h-3 w-3 mr-1" />;
        break;
      case "paid":
        variant = "default";
        colorClass = "bg-green-500 hover:bg-green-600 text-white";
        icon = <CheckCircle className="h-3 w-3 mr-1" />;
        break;
      case "overdue":
        variant = "destructive";
        icon = <XCircle className="h-3 w-3 mr-1" />;
        break;
      case "cancelled":
        variant = "destructive";
        colorClass = "bg-gray-500 hover:bg-gray-600 text-white";
        icon = <XCircle className="h-3 w-3 mr-1" />;
        break;
    }
    return <Badge className={cn("w-fit", colorClass)} variant={variant}>{icon} {status.replace('_', ' ')}</Badge>;
  };

  const remainingAmount = invoice.total_amount - (invoice.paid_amount || 0);
  const isFullyPaid = remainingAmount <= 0;
  const isOverdue = new Date(invoice.due_date) < new Date() && !isFullyPaid && invoice.status !== "cancelled";

  const generatePdfContent = (invoice: InvoiceWithRelations, items: InvoiceItem[], payments: Payment[], company: Company | null) => {
    const clientName = invoice.clients?.nome || "N/A";
    const projectName = invoice.projects?.nome || "N/A";

    const itemRows = items.map(item => `
      <tr>
        <td style="border: 1px solid #ccc; padding: 8px;">${item.description}</td>
        <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${item.quantity}</td>
        <td style="border: 1px solid #ccc; padding: 8px;">${item.unit}</td>
        <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${formatCurrency(item.unit_price)}</td>
        <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${formatCurrency(item.line_total)}</td>
      </tr>
    `).join('');

    const paymentRows = payments.map(payment => `
      <tr>
        <td style="border: 1px solid #ccc; padding: 8px;">${formatDate(payment.payment_date)}</td>
        <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${formatCurrency(payment.amount)}</td>
        <td style="border: 1px solid #ccc; padding: 8px;">${payment.payment_method.replace('_', ' ')}</td>
        <td style="border: 1px solid #ccc; padding: 8px;">${payment.notes || 'N/A'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fatura ${invoice.invoice_number}</title>
          <link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
              body { font-family: 'Red Hat Display', sans-serif; margin: 40px; color: #333; line-height: 1.6; }
              h1 { color: #00679d; text-align: center; margin-bottom: 30px; }
              h2 { color: #00679d; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 40px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: 600; }
              .header-info { margin-bottom: 30px; background-color: #f9f9f9; padding: 15px; border-radius: 8px; }
              .header-info p { margin: 8px 0; font-size: 0.95em; }
              .summary { margin-top: 30px; padding: 15px; background-color: #e6f7ff; border-left: 5px solid #00679d; border-radius: 8px; }
              .summary p { margin: 5px 0; font-weight: 500; }
              .footer { margin-top: 50px; font-size: 0.75em; text-align: center; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
              .status-badge { display: inline-block; padding: 5px 10px; border-radius: 5px; font-weight: bold; text-transform: capitalize; }
              .status-pending { background-color: #ffedd5; color: #ea580c; }
              .status-paid { background-color: #dcfce7; color: #16a34a; }
              .status-overdue { background-color: #fee2e2; color: #ef4444; }
              .status-cancelled { background-color: #e5e7eb; color: #6b7280; }
              .company-logo { max-height: 60px; margin-bottom: 15px; }
              @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
              }
          </style>
      </head>
      <body>
          <div class="no-print">
            <button onclick="window.print()" style="position: fixed; top: 20px; right: 20px; padding: 10px 20px; background-color: #00679d; color: white; border: none; border-radius: 5px; cursor: pointer;">Imprimir PDF</button>
            <button onclick="window.close()" style="position: fixed; top: 20px; right: 150px; padding: 10px 20px; background-color: #ccc; color: #333; border: none; border-radius: 5px; cursor: pointer;">Fechar</button>
          </div>
          <h1>FATURA Nº ${invoice.invoice_number}</h1>
          <div class="header-info">
              ${company?.logo_url ? `<img src="${company.logo_url}" alt="${company.name} Logo" class="company-logo" />` : ''}
              <p><strong>Empresa:</strong> ${company?.name || 'N/A'}</p>
              <p><strong>NIF da Empresa:</strong> ${company?.nif || 'N/A'}</p>
              <p><strong>Endereço da Empresa:</strong> ${company?.address || 'N/A'}</p>
              <p><strong>Cliente:</strong> ${clientName}</p>
              <p><strong>Obra:</strong> ${projectName}</p>
              <p><strong>Data de Emissão:</strong> ${formatDate(invoice.issue_date)}</p>
              <p><strong>Data de Vencimento:</strong> ${formatDate(invoice.due_date)}</p>
              <p><strong>Estado:</strong> <span class="status-badge status-${invoice.status}">${invoice.status.replace('_', ' ')}</span></p>
              ${invoice.notes ? `<p><strong>Notas:</strong> ${invoice.notes}</p>` : ''}
          </div>

          <h2>Itens da Fatura</h2>
          ${items.length > 0 ? `
          <table>
              <thead>
                  <tr>
                      <th style="width: 40%;">Descrição</th>
                      <th style="width: 10%; text-align: right;">Quantidade</th>
                      <th style="width: 10%;">Unidade</th>
                      <th style="width: 20%; text-align: right;">Preço Unitário</th>
                      <th style="width: 20%; text-align: right;">Total</th>
                  </tr>
              </thead>
              <tbody>
                  ${itemRows}
              </tbody>
          </table>
          ` : `<p style="text-align: center; margin-top: 20px; color: #777;">Nenhum item na fatura.</p>`}

          <div class="summary">
              <p><strong>Valor Total da Fatura:</strong> ${formatCurrency(invoice.total_amount)}</p>
              <p><strong>Valor Pago:</strong> ${formatCurrency(invoice.paid_amount || 0)}</p>
              <p><strong>Valor Pendente:</strong> ${formatCurrency(remainingAmount)}</p>
          </div>

          <h2>Histórico de Pagamentos</h2>
          ${payments.length > 0 ? `
          <table>
              <thead>
                  <tr>
                      <th style="width: 20%;">Data do Pagamento</th>
                      <th style="width: 20%; text-align: right;">Valor</th>
                      <th style="width: 20%;">Método</th>
                      <th style="width: 40%;">Notas</th>
                  </tr>
              </thead>
              <tbody>
                  ${paymentRows}
              </tbody>
          </table>
          ` : `<p style="text-align: center; margin-top: 20px; color: #777;">Nenhum pagamento registado para esta fatura.</p>`}

          <div class="footer">
              <p>Documento gerado automaticamente pelo Obra Sys.</p>
          </div>
      </body>
      </html>
    `;
  };

  const handleGeneratePdf = () => {
    const content = generatePdfContent(invoice, invoiceItems, payments, companyData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
    } else {
      toast.error("Não foi possível abrir a janela de impressão. Verifique as configurações de pop-up.");
    }
  };

  if (isLoadingDetails) {
    return (
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-8 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Fatura Nº {invoice.invoice_number}</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onEditInvoice(invoice)} variant="outline" disabled={isProcessingAction}>
            <Edit className="h-4 w-4 mr-2" /> Editar Fatura
          </Button>
          <Button onClick={handleGeneratePdf} variant="outline" disabled={isProcessingAction}>
            <Download className="h-4 w-4 mr-2" /> Gerar PDF
          </Button>
          {!isFullyPaid && invoice.status !== "cancelled" && (
            <Button onClick={() => setIsPaymentDialogOpen(true)} disabled={isProcessingAction}>
              <PlusCircle className="h-4 w-4 mr-2" /> Registar Pagamento
            </Button>
          )}
          {invoice.status === "pending" && (
            <Button variant="destructive" onClick={() => handleUpdateInvoiceStatus("cancelled")} disabled={isProcessingAction}>
              {isProcessingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />} Cancelar Fatura
            </Button>
          )}
          {invoice.status === "cancelled" && (
            <Button variant="secondary" onClick={() => handleUpdateInvoiceStatus("pending")} disabled={isProcessingAction}>
              {isProcessingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> /> : <CheckCircle className="h-4 w-4 mr-2" />} Reativar Fatura
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><span className="font-semibold">Cliente:</span> {invoice.clients?.nome || "N/A"}</div>
          <div><span className="font-semibold">Obra:</span> {invoice.projects?.nome || "N/A"}</div>
          <div><span className="font-semibold">Data de Emissão:</span> {formatDate(invoice.issue_date)}</div>
          <div><span className="font-semibold">Data de Vencimento:</span> {formatDate(invoice.due_date)}</div>
          <div><span className="font-semibold">Estado:</span> {getStatusBadge(invoice.status)}</div>
          <div><span className="font-semibold">Valor Total:</span> {formatCurrency(invoice.total_amount)}</div>
          <div><span className="font-semibold">Valor Pago:</span> {formatCurrency(invoice.paid_amount || 0)}</div>
          <div><span className="font-semibold">Valor Pendente:</span> {formatCurrency(remainingAmount)}</div>
          {invoice.notes && <div className="md:col-span-2"><span className="font-semibold">Notas:</span> {invoice.notes}</div>}
        </div>

        <Separator />

        <h3 className="text-lg font-semibold">Itens da Fatura</h3>
        {invoiceItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Descrição</th>
                  <th scope="col" className="px-6 py-3 text-right">Qtd.</th>
                  <th scope="col" className="px-6 py-3">Un.</th>
                  <th scope="col" className="px-6 py-3 text-right">Preço Unit.</th>
                  <th scope="col" className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item) => (
                  <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.description}</td>
                    <td className="px-6 py-4 text-right">{item.quantity}</td>
                    <td className="px-6 py-4">{item.unit}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum item nesta fatura.</p>
        )}

        <Separator />

        <h3 className="text-lg font-semibold">Histórico de Pagamentos</h3>
        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Data</th>
                  <th scope="col" className="px-6 py-3 text-right">Valor</th>
                  <th scope="col" className="px-6 py-3">Método</th>
                  <th scope="col" className="px-6 py-3">Notas</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4">{formatDate(payment.payment_date)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(payment.amount)}</td>
                    <td className="px-6 py-4 capitalize">{payment.payment_method.replace('_', ' ')}</td>
                    <td className="px-6 py-4">{payment.notes || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum pagamento registado para esta fatura.</p>
        )}
      </CardContent>

      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        onSave={handleRecordPayment}
        invoiceId={invoice.id || ""}
        maxAmount={remainingAmount}
      />
    </Card>
  );
};

export default InvoiceDetailView;