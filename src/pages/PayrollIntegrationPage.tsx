"use client";

import React, { useState, useEffect, useCallback } from "react";
import EmptyState from "@/components/EmptyState";
import { ClipboardList, PlusCircle, Filter, Download, RefreshCw, Loader2, Eye, Edit, Trash2, CheckCircle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "@/components/SessionContextProvider";
import { PayrollEntry, PayrollEntryWithRelations } from "@/schemas/payroll-schema";
import { Project } from "@/schemas/project-schema";
import { Profile } from "@/schemas/profile-schema";
import { DataTable } from "@/components/work-items/data-table";
import { createPayrollColumns } from "@/components/payroll/PayrollColumns";
import CreateEditPayrollEntryDialog from "@/components/payroll/CreateEditPayrollEntryDialog";
import KPICard from "@/components/KPICard";
import { formatCurrency } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";

const PayrollIntegrationPage = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntryWithRelations[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companyMembers, setCompanyMembers] = useState<Profile[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isPayrollEntryDialogOpen, setIsPayrollEntryDialogOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<PayrollEntry | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Fetch user's company ID
  const fetchUserCompanyId = useCallback(async () => {
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

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!userCompanyId) {
      setProjects([]);
      return;
    }
    const { data, error } = await supabase
      .from('projects')
      .select('id, nome')
      .eq('company_id', userCompanyId)
      .order('nome', { ascending: true });

    if (error) {
      toast.error(`Erro ao carregar obras: ${error.message}`);
      console.error("Erro ao carregar obras:", error);
      setProjects([]);
    } else {
      setProjects(data || []);
    }
  }, [userCompanyId]);

  // Fetch company members (profiles)
  const fetchCompanyMembers = useCallback(async () => {
    if (!userCompanyId) {
      setCompanyMembers([]);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('company_id', userCompanyId)
      .order('first_name', { ascending: true });

    if (error) {
      toast.error(`Erro ao carregar colaboradores: ${error.message}`);
      console.error("Erro ao carregar colaboradores:", error);
      setCompanyMembers([]);
    } else {
      setCompanyMembers(data || []);
    }
  }, [userCompanyId]);

  // Fetch payroll entries
  const fetchPayrollEntries = useCallback(async () => {
    if (!userCompanyId) {
      setPayrollEntries([]);
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    const { data, error } = await supabase
      .from('payroll_entries')
      .select(`
        *,
        projects(nome),
        users:profiles(first_name, last_name)
      `)
      .eq('company_id', userCompanyId)
      .order('entry_date', { ascending: false });

    if (error) {
      toast.error(`Erro ao carregar registos de folha de pagamento: ${error.message}`);
      console.error("Erro ao carregar registos de folha de pagamento:", error);
      setPayrollEntries([]);
    } else {
      setPayrollEntries(data || []);
    }
    setIsLoadingData(false);
  }, [userCompanyId]);

  useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
  }, [isSessionLoading, fetchUserCompanyId]);

  useEffect(() => {
    if (userCompanyId) {
      fetchProjects();
      fetchCompanyMembers();
      fetchPayrollEntries();
    }
  }, [userCompanyId, fetchProjects, fetchCompanyMembers, fetchPayrollEntries]);

  const handleSavePayrollEntry = async () => {
    fetchPayrollEntries();
    setIsPayrollEntryDialogOpen(false);
    setEntryToEdit(null);
  };

  const handleViewPayrollEntry = (entry: PayrollEntryWithRelations) => {
    toast.info(`Visualizar detalhes do registo: ${entry.description}`);
    // For now, just a toast. In a real app, this would open a detail view.
  };

  const handleEditPayrollEntry = (entry: PayrollEntryWithRelations) => {
    setEntryToEdit(entry);
    setIsPayrollEntryDialogOpen(true);
  };

  const handleMarkAsPaid = async (entry: PayrollEntryWithRelations) => {
    if (!window.confirm(`Tem certeza que deseja marcar o registo "${entry.description}" como pago?`)) return;
    setIsProcessingAction(true);
    try {
      const { error } = await supabase
        .from('payroll_entries')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', entry.id)
        .eq('company_id', userCompanyId);

      if (error) throw error;

      toast.success("Registo marcado como pago com sucesso!");
      fetchPayrollEntries();
    } catch (error: any) {
      toast.error(`Erro ao marcar registo como pago: ${error.message}`);
      console.error("Erro ao marcar registo como pago:", error);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeletePayrollEntry = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja eliminar este registo de folha de pagamento?")) return;
    setIsProcessingAction(true);
    try {
      const { error } = await supabase
        .from('payroll_entries')
        .delete()
        .eq('id', id)
        .eq('company_id', userCompanyId);

      if (error) throw error;

      toast.success("Registo eliminado com sucesso!");
      fetchPayrollEntries();
    } catch (error: any) {
      toast.error(`Erro ao eliminar registo: ${error.message}`);
      console.error("Erro ao eliminar registo:", error);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const columns = createPayrollColumns({
    onView: handleViewPayrollEntry,
    onEdit: handleEditPayrollEntry,
    onMarkAsPaid: handleMarkAsPaid,
    onDelete: handleDeletePayrollEntry,
  });

  // KPIs
  const totalPayrollCost = payrollEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalPaidPayroll = payrollEntries.filter(entry => entry.status === "paid").reduce((sum, entry) => sum + entry.amount, 0);
  const totalPendingPayroll = payrollEntries.filter(entry => entry.status === "pending" || entry.status === "processed").reduce((sum, entry) => sum + entry.amount, 0);
  const pendingEntriesCount = payrollEntries.filter(entry => entry.status === "pending").length;

  if (isLoadingData) {
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
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
            Integração de Folha de Pagamento
          </h1>
          <Button onClick={fetchPayrollEntries} disabled={isLoadingData || isProcessingAction} className="flex items-center gap-2">
            {isLoadingData ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar Registos
          </Button>
        </div>
        <section className="text-center max-w-3xl mx-auto mb-8">
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Rastreie com precisão os custos de mão de obra, incluindo salários, benefícios e impostos, e integre com sistemas de folha de pagamento.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <KPICard
            title="Custo Total de Mão de Obra (€)"
            value={formatCurrency(totalPayrollCost)}
            description="Total de todos os registos"
            icon={DollarSign}
            iconColorClass="text-blue-500"
          />
          <KPICard
            title="Total Pago (€)"
            value={formatCurrency(totalPaidPayroll)}
            description="Valor já liquidado"
            icon={CheckCircle}
            iconColorClass="text-green-500"
          />
          <KPICard
            title="Total Pendente (€)"
            value={formatCurrency(totalPendingPayroll)}
            description="Valor a pagar/processar"
            icon={DollarSign}
            iconColorClass="text-orange-500"
          />
          <KPICard
            title="Registos Pendentes"
            value={pendingEntriesCount.toString()}
            description="Registos aguardando ação"
            icon={ClipboardList}
            iconColorClass="text-red-500"
          />
        </section>

        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
            <CardTitle className="text-2xl font-semibold">Registos de Folha de Pagamento</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { setEntryToEdit(null); setIsPayrollEntryDialogOpen(true); }} className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" /> Novo Registo
              </Button>
              <Button variant="outline" className="flex items-center gap-2" disabled>
                <Filter className="h-4 w-4" /> Filtros
              </Button>
              <Button variant="outline" className="flex items-center gap-2" disabled>
                <Download className="h-4 w-4" /> Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {payrollEntries.length > 0 ? (
              <DataTable
                columns={columns}
                data={payrollEntries}
                filterColumnId="description"
                filterPlaceholder="Filtrar por descrição..."
              />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="Nenhum registo de folha de pagamento encontrado"
                description="Crie um novo registo para começar a gerir os custos de mão de obra."
                buttonText="Novo Registo de Folha de Pagamento"
                onButtonClick={() => { setEntryToEdit(null); setIsPayrollEntryDialogOpen(true); }}
              />
            )}
          </CardContent>
        </Card>

        <CreateEditPayrollEntryDialog
          isOpen={isPayrollEntryDialogOpen}
          onClose={() => setIsPayrollEntryDialogOpen(false)}
          onSave={handleSavePayrollEntry}
          entryToEdit={entryToEdit}
          projects={projects}
          companyMembers={companyMembers}
          userCompanyId={userCompanyId}
        />
      </div>
    </>
  );
};

export default PayrollIntegrationPage;