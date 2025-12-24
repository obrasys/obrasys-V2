"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Download, ReceiptText, RefreshCw, ArrowLeft, Loader2, CheckCircle, DollarSign, XCircle, Scale } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Invoice, InvoiceWithRelations } from "@/schemas/invoicing-schema";
import { DataTable } from "@/components/work-items/data-table";
import { createInvoiceColumns } from "@/components/invoicing/InvoiceColumns";
import CreateEditInvoiceDialog from "@/components/invoicing/CreateEditInvoiceDialog";
import InvoiceDetailView from "@/components/invoicing/InvoiceDetailView";
import KPICard from "@/components/KPICard";
import { formatCurrency } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";

const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);
  const [invoices, setInvoices] = React.useState<InvoiceWithRelations[]>([]);
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceWithRelations | null>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = React.useState(true);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = React.useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = React.useState<Invoice | null>(null);

  console.log("AccountsPage: selectedInvoice", selectedInvoice);
  console.log("AccountsPage: isInvoiceDialogOpen", isInvoiceDialogOpen);
  console.log("AccountsPage: invoiceToEdit", invoiceToEdit);

  // Fetch user's company ID
  const fetchUserCompanyId = React.useCallback(async () => {
    if (!user) {
      setUserCompanyId(null);
      return;
    }
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Erro ao carregar company_id do perfil:", profileError);
      setUserCompanyId(null);
    } else if (profileData) {
      setUserCompanyId(profileData.company_id);
    }
  }, [user]);

  // Fetch invoices for the current company
  const fetchInvoices = React.useCallback(async () => {
    if (!userCompanyId) {
      setInvoices([]);
      setIsLoadingInvoices(false);
      return;
    }
    setIsLoadingInvoices(true);
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        projects(nome),
        clients(nome)
      `)
      .eq('company_id', userCompanyId)
      .order('issue_date', { ascending: false });

    if (invoicesError) {
      toast.error(`Erro ao carregar faturas: ${invoicesError.message}`);
      console.error("Erro ao carregar faturas:", invoicesError);
      setInvoices([]);
    } else {
      setInvoices(invoicesData || []);
    }
    setIsLoadingInvoices(false);
  }, [userCompanyId]);

  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
  }, [isSessionLoading, fetchUserCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchInvoices();
    }
  }, [userCompanyId, fetchInvoices]);

  // NOVO useEffect para gerir a atualização do objeto selectedInvoice
  React.useEffect(() => {
    if (selectedInvoice) {
      const updatedSelected = invoices.find(inv => inv.id === selectedInvoice.id);
      // Apenas atualiza se a referência do objeto for diferente ou se o objeto foi removido
      if (updatedSelected !== selectedInvoice) {
        setSelectedInvoice(updatedSelected || null);
      }
    }
  }, [invoices, selectedInvoice]); // Depende da lista de faturas e do objeto selecionado

  const handleSaveInvoice = async (fullInvoice: InvoiceWithRelations) => {
    // This function is called by CreateEditInvoiceDialog after successful upsert
    // The actual persistence logic is inside the dialog, so here we just refresh
    fetchInvoices();
    setIsInvoiceDialogOpen(false);
    setInvoiceToEdit(null);
  };

  const handleViewInvoice = (invoice: InvoiceWithRelations) => {
    setSelectedInvoice(invoice);
  };

  const handleEditInvoice = (invoice: InvoiceWithRelations) => {
    setInvoiceToEdit(invoice);
    setIsInvoiceDialogOpen(true);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja eliminar esta fatura e todos os seus itens e pagamentos?")) return;
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('company_id', userCompanyId); // Ensure RLS is respected

      if (error) throw error;

      toast.success("Fatura eliminada com sucesso!");
      fetchInvoices();
      if (selectedInvoice?.id === id) {
        setSelectedInvoice(null);
      }
    } catch (error: any) {
      toast.error(`Erro ao eliminar fatura: ${error.message}`);
      console.error("Erro ao eliminar fatura:", error);
    }
  };

  const handleRecordPayment = (invoice: InvoiceWithRelations) => {
    setSelectedInvoice(invoice); // Ensure the correct invoice is selected for the dialog
    // The PaymentDialog is opened from InvoiceDetailView, so this function is not directly used here.
    // It's kept for completeness if a direct "Record Payment" button were on the main list.
  };

  const columns = createInvoiceColumns({
    onView: handleViewInvoice,
    onEdit: handleEditInvoice,
    onRecordPayment: handleRecordPayment,
    onDelete: handleDeleteInvoice,
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const totalPending = totalInvoiced - totalPaid;
  const overdueInvoices = invoices.filter(inv => inv.status === "overdue").length;

  if (isLoadingInvoices) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          <div>
            <Skeleton className="h-8 w-64 bg-gray-200 rounded mb-2" />
            <Skeleton className="h-4 w-48 bg-gray-200 rounded" />
          </div>
          <Skeleton className="h-10 w-40 mt-2 md:mt-0" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Contas a Pagar e Receber</h1>
          <p className="text-muted-foreground text-sm">
            Gestão completa do ciclo de vida das faturas, pedidos e pagamentos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          {selectedInvoice && (
            <Button variant="ghost" onClick={() => setSelectedInvoice(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Voltar à Lista
            </Button>
          )}
          <Button onClick={fetchInvoices} disabled={isLoadingInvoices} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button onClick={() => { setInvoiceToEdit(null); setIsInvoiceDialogOpen(true); }} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Nova Fatura
          </Button>
          <Button variant="outline" className="flex items-center gap-2" disabled>
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline" className="flex items-center gap-2" disabled>
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {selectedInvoice ? (
        <InvoiceDetailView
          invoice={selectedInvoice}
          onInvoiceUpdated={fetchInvoices}
          onEditInvoice={handleEditInvoice}
        />
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <KPICard
              title="Total Faturado (€)"
              value={formatCurrency(totalInvoiced)}
              description="Valor total das faturas"
              icon={ReceiptText}
              iconColorClass="text-blue-500"
            />
            <KPICard
              title="Total Pago (€)"
              value={formatCurrency(totalPaid)}
              description="Valor total recebido"
              icon={CheckCircle}
              iconColorClass="text-green-500"
            />
            <KPICard
              title="Total Pendente (€)"
              value={formatCurrency(totalPending)}
              description="Valor a receber"
              icon={DollarSign}
              iconColorClass="text-orange-500"
            />
            <KPICard
              title="Faturas Atrasadas"
              value={overdueInvoices.toString()}
              description="Faturas com vencimento expirado"
              icon={XCircle}
              iconColorClass="text-red-500"
            />
          </section>

          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Faturas a Receber</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={invoices}
                  filterColumnId="invoice_number"
                  filterPlaceholder="Filtrar por número da fatura..."
                />
              ) : (
                <EmptyState
                  icon={ReceiptText}
                  title="Nenhuma fatura encontrada"
                  description="Comece por criar uma nova fatura para gerir os seus recebimentos."
                  buttonText="Nova Fatura"
                  onButtonClick={() => { setInvoiceToEdit(null); setIsInvoiceDialogOpen(true); }}
                />
              )}
            </CardContent>
          </Card>
          {/* Placeholder for Contas a Pagar section */}
          <Card className="bg-card text-card-foreground border border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">Contas a Pagar (Em breve)</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Scale}
                title="Gestão de Contas a Pagar"
                description="Esta secção permitirá gerir as suas despesas e pagamentos a fornecedores."
                buttonText="Adicionar Despesa (Em breve)"
                buttonDisabled={true}
              />
            </CardContent>
          </Card>
        </>
      )}

      <CreateEditInvoiceDialog
        isOpen={isInvoiceDialogOpen}
        onClose={() => setIsInvoiceDialogOpen(false)}
        onSave={handleSaveInvoice}
        invoiceToEdit={invoiceToEdit}
      />
    </div>
  );
};

export default AccountsPage;