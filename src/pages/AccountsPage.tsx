"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Download, ReceiptText, RefreshCw, ArrowLeft, Loader2, CheckCircle, DollarSign, XCircle, Scale, Wallet, Edit, Trash2 } from "lucide-react"; // Adicionado Edit e Trash2
import EmptyState from "@/components/EmptyState";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Invoice, InvoiceWithRelations, Expense } from "@/schemas/invoicing-schema";
import { DataTable } from "@/components/work-items/data-table";
import { createInvoiceColumns } from "@/components/invoicing/InvoiceColumns";
import { createExpenseColumns } from "@/components/invoicing/ExpenseColumns"; // Import new expense columns
import CreateEditInvoiceDialog from "@/components/invoicing/CreateEditInvoiceDialog";
import CreateEditExpenseDialog from "@/components/invoicing/CreateEditExpenseDialog"; // Import new expense dialog
import InvoiceDetailView from "@/components/invoicing/InvoiceDetailView";
import KPICard from "@/components/KPICard";
import { formatCurrency, formatDate } from "@/utils/formatters"; // Importado formatDate
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs

const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);

  // State for Invoices (Contas a Receber)
  const [invoices, setInvoices] = React.useState<InvoiceWithRelations[]>([]);
  const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceWithRelations | null>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = React.useState(true);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = React.useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = React.useState<Invoice | null>(null);

  // State for Expenses (Contas a Pagar)
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = React.useState<Expense | null>(null);
  const [isLoadingExpenses, setIsLoadingExpenses] = React.useState(true);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = React.useState(false);
  const [expenseToEdit, setExpenseToEdit] = React.useState<Expense | null>(null);

  const [activeTab, setActiveTab] = React.useState("receber"); // 'receber' or 'pagar'

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

  // Fetch expenses for the current company
  const fetchExpenses = React.useCallback(async () => {
    if (!userCompanyId) {
      setExpenses([]);
      setIsLoadingExpenses(false);
      return;
    }
    setIsLoadingExpenses(true);
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('company_id', userCompanyId)
      .order('due_date', { ascending: true });

    if (expensesError) {
      toast.error(`Erro ao carregar despesas: ${expensesError.message}`);
      console.error("Erro ao carregar despesas:", expensesError);
      setExpenses([]);
    } else {
      // Filter expenses that might be related to the project if a project_id column existed in expenses
      // For now, we'll just show all company expenses, or filter by project if a link is added later.
      setExpenses(expensesData || []);
    }
    setIsLoadingExpenses(false);
  }, [userCompanyId]);

  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
  }, [isSessionLoading, fetchUserCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchInvoices();
      fetchExpenses(); // Fetch expenses when company ID is available
    }
  }, [userCompanyId, fetchInvoices, fetchExpenses]);

  // Effect to update selectedInvoice object when invoices list changes
  React.useEffect(() => {
    if (selectedInvoice) {
      const updatedSelected = invoices.find(inv => inv.id === selectedInvoice.id);
      if (updatedSelected !== selectedInvoice) {
        setSelectedInvoice(updatedSelected || null);
      }
    }
  }, [invoices, selectedInvoice]);

  // Effect to update selectedExpense object when expenses list changes
  React.useEffect(() => {
    if (selectedExpense) {
      const updatedSelected = expenses.find(exp => exp.id === selectedExpense.id);
      if (updatedSelected !== selectedExpense) {
        setSelectedExpense(updatedSelected || null);
      }
    }
  }, [expenses, selectedExpense]);

  // --- Invoice Handlers (Contas a Receber) ---
  const handleSaveInvoice = async () => {
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
        .eq('company_id', userCompanyId);

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
    setSelectedInvoice(invoice);
    // PaymentDialog is opened from InvoiceDetailView, so this is mostly a placeholder
  };

  const invoiceColumns = createInvoiceColumns({
    onView: handleViewInvoice,
    onEdit: handleEditInvoice,
    onRecordPayment: handleRecordPayment,
    onDelete: handleDeleteInvoice,
  });

  // --- Expense Handlers (Contas a Pagar) ---
  const handleSaveExpense = async () => {
    fetchExpenses();
    setIsExpenseDialogOpen(false);
    setExpenseToEdit(null);
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleMarkExpenseAsPaid = async (expense: Expense) => {
    if (!window.confirm(`Tem certeza que deseja marcar a despesa "${expense.description}" como paga?`)) return;
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', expense.id)
        .eq('company_id', userCompanyId);

      if (error) throw error;

      toast.success("Despesa marcada como paga com sucesso!");
      fetchExpenses();
    } catch (error: any) {
      toast.error(`Erro ao marcar despesa como paga: ${error.message}`);
      console.error("Erro ao marcar despesa como paga:", error);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja eliminar esta despesa?")) return;
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('company_id', userCompanyId);

      if (error) throw error;

      toast.success("Despesa eliminada com sucesso!");
      fetchExpenses();
      if (selectedExpense?.id === id) {
        setSelectedExpense(null);
      }
    } catch (error: any) {
      toast.error(`Erro ao eliminar despesa: ${error.message}`);
      console.error("Erro ao eliminar despesa:", error);
    }
  };

  const expenseColumns = createExpenseColumns({
    onView: handleViewExpense,
    onEdit: handleEditExpense,
    onMarkAsPaid: handleMarkExpenseAsPaid,
    onDelete: handleDeleteExpense,
  });

  // --- KPIs ---
  // Invoices KPIs
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPaidInvoices = invoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const totalPendingInvoices = totalInvoiced - totalPaidInvoices;
  const overdueInvoicesCount = invoices.filter(inv => inv.status === "overdue").length;

  // Expenses KPIs
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalPaidExpenses = expenses.filter(exp => exp.status === "paid").reduce((sum, exp) => sum + exp.amount, 0);
  const totalPendingExpenses = expenses.filter(exp => exp.status === "pending" || exp.status === "overdue").reduce((sum, exp) => sum + exp.amount, 0);
  const overdueExpensesCount = expenses.filter(exp => exp.status === "overdue").length;

  if (isLoadingInvoices || isLoadingExpenses) {
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
          {(selectedInvoice || selectedExpense) && (
            <Button variant="ghost" onClick={() => { setSelectedInvoice(null); setSelectedExpense(null); }} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Voltar à Lista
            </Button>
          )}
          <Button onClick={() => { fetchInvoices(); fetchExpenses(); }} disabled={isLoadingInvoices || isLoadingExpenses} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          {activeTab === "receber" ? (
            <Button onClick={() => { setInvoiceToEdit(null); setIsInvoiceDialogOpen(true); }} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Nova Fatura
            </Button>
          ) : (
            <Button onClick={() => { setExpenseToEdit(null); setIsExpenseDialogOpen(true); }} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Nova Despesa
            </Button>
          )}
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
      ) : selectedExpense ? (
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">Detalhes da Despesa</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleEditExpense(selectedExpense)} variant="outline">
                <Edit className="h-4 w-4 mr-2" /> Editar Despesa
              </Button>
              {selectedExpense.status === "pending" && (
                <Button onClick={() => handleMarkExpenseAsPaid(selectedExpense)}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Marcar como Paga
                </Button>
              )}
              <Button variant="destructive" onClick={() => handleDeleteExpense(selectedExpense.id || "")}>
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar Despesa
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><span className="font-semibold">Fornecedor:</span> {selectedExpense.supplier_name}</div>
              <div><span className="font-semibold">Descrição:</span> {selectedExpense.description}</div>
              <div><span className="font-semibold">Valor:</span> {formatCurrency(selectedExpense.amount)}</div>
              <div><span className="font-semibold">Data de Vencimento:</span> {formatDate(selectedExpense.due_date)}</div>
              <div><span className="font-semibold">Estado:</span> {selectedExpense.status.replace('_', ' ')}</div>
              {selectedExpense.notes && <div className="md:col-span-2"><span className="font-semibold">Notas:</span> {selectedExpense.notes}</div>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
              <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
            </TabsList>
            <Separator className="my-4" />

            <TabsContent value="receber" className="space-y-6">
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <KPICard
                  title="Total Faturado (€)"
                  value={formatCurrency(totalInvoiced)}
                  description="Valor total das faturas"
                  icon={ReceiptText}
                  iconColorClass="text-blue-500"
                />
                <KPICard
                  title="Total Recebido (€)"
                  value={formatCurrency(totalPaidInvoices)}
                  description="Valor total recebido"
                  icon={CheckCircle}
                  iconColorClass="text-green-500"
                />
                <KPICard
                  title="Total Pendente (€)"
                  value={formatCurrency(totalPendingInvoices)}
                  description="Valor a receber"
                  icon={DollarSign}
                  iconColorClass="text-orange-500"
                />
                <KPICard
                  title="Faturas Atrasadas"
                  value={overdueInvoicesCount.toString()}
                  description="Faturas com vencimento expirado"
                  icon={XCircle}
                  iconColorClass="text-red-500"
                />
              </section>

              <Card className="bg-card text-card-foreground border border-border">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold">Lista de Faturas</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoices.length > 0 ? (
                    <DataTable
                      columns={invoiceColumns}
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
            </TabsContent>

            <TabsContent value="pagar" className="space-y-6">
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <KPICard
                  title="Total de Despesas (€)"
                  value={formatCurrency(totalExpenses)}
                  description="Valor total das despesas"
                  icon={Wallet}
                  iconColorClass="text-purple-500"
                />
                <KPICard
                  title="Total Pago (€)"
                  value={formatCurrency(totalPaidExpenses)}
                  description="Valor total pago"
                  icon={CheckCircle}
                  iconColorClass="text-green-500"
                />
                <KPICard
                  title="Total Pendente (€)"
                  value={formatCurrency(totalPendingExpenses)}
                  description="Valor a pagar"
                  icon={DollarSign}
                  iconColorClass="text-orange-500"
                />
                <KPICard
                  title="Despesas Atrasadas"
                  value={overdueExpensesCount.toString()}
                  description="Despesas com vencimento expirado"
                  icon={XCircle}
                  iconColorClass="text-red-500"
                />
              </section>

              <Card className="bg-card text-card-foreground border border-border">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold">Lista de Despesas</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenses.length > 0 ? (
                    <DataTable
                      columns={expenseColumns}
                      data={expenses}
                      filterColumnId="description"
                      filterPlaceholder="Filtrar por descrição..."
                    />
                  ) : (
                    <EmptyState
                      icon={Wallet}
                      title="Nenhuma despesa encontrada"
                      description="Comece por criar uma nova despesa para gerir as suas contas a pagar."
                      buttonText="Nova Despesa"
                      onButtonClick={() => { setExpenseToEdit(null); setIsExpenseDialogOpen(true); }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      <CreateEditInvoiceDialog
        isOpen={isInvoiceDialogOpen}
        onClose={() => setIsInvoiceDialogOpen(false)}
        onSave={handleSaveInvoice}
        invoiceToEdit={invoiceToEdit}
      />

      <CreateEditExpenseDialog
        isOpen={isExpenseDialogOpen}
        onClose={() => setIsExpenseDialogOpen(false)}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
};

export default AccountsPage;