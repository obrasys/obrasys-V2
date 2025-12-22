"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Download, Calculator, DollarSign, FileText, TrendingUp, LineChart, HardHat, CalendarDays, UserPlus, Check, Trash2, Edit } from "lucide-react";
import KPICard from "@/components/KPICard";
import EmptyState from "@/components/EmptyState";
import { DataTable } from "@/components/work-items/data-table"; // Reusing generic DataTable
import { createBudgetColumns } from "@/components/budgeting/columns";
import { BudgetItem, BudgetWithRelations, BudgetChapterWithItems } from "@/schemas/budget-schema"; // Import the new types
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import CreateEditClientDialog from "@/components/budgeting/create-edit-client-dialog"; // Import the new dialog
import CreateEditProjectDialog from "@/components/projects/create-edit-project-dialog"; // Import the new project dialog
import { Client } from "@/schemas/client-schema"; // Import Client type
import { Project } from "@/schemas/project-schema"; // Import Project type
import { supabase } from "@/integrations/supabase/client"; // Import supabase client
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Adicionado: Importação dos componentes Select
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import { useSession } from "@/components/SessionContextProvider"; // Importar useSession

// Import new modular components
import BudgetingHeader from "@/components/budgeting/BudgetingHeader";
import BudgetSelectionAndActions from "@/components/budgeting/BudgetSelectionAndActions";
import BudgetFinancialKPIs from "@/components/budgeting/BudgetFinancialKPIs";
import BudgetDetailTable from "@/components/budgeting/BudgetDetailTable";
import BudgetCostControlChart from "@/components/budgeting/BudgetCostControlChart";
import BudgetIntegrations from "@/components/budgeting/BudgetIntegrations";


const Budgeting = () => {
  const [budgets, setBudgets] = React.useState<BudgetWithRelations[]>([]); // Use BudgetWithRelations
  const [selectedBudgetId, setSelectedBudgetId] = React.useState<string | null>(null); // Armazena apenas o ID
  const selectedBudget = React.useMemo(() => budgets.find(b => b.id === selectedBudgetId), [budgets, selectedBudgetId]); // Deriva o objeto
  
  const [isClientDialogOpen, setIsClientDialogOpen] = React.useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const navigate = useNavigate();
  const { user } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);

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

  // Fetch clients for the current company
  const fetchClients = React.useCallback(async () => {
    if (!userCompanyId) {
      setClients([]);
      return;
    }
    const { data, error } = await supabase.from('clients').select('id, nome').eq('company_id', userCompanyId);
    if (error) {
      toast.error(`Erro ao carregar clientes: ${error.message}`);
      console.error("Erro ao carregar clientes:", error);
    } else {
      setClients(data || []);
    }
  }, [userCompanyId]);

  // Fetch budgets, chapters, and items for the current company
  const fetchBudgets = React.useCallback(async () => {
    if (!userCompanyId) {
      setBudgets([]);
      setSelectedBudgetId(null); // Limpa o ID selecionado
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data: budgetsData, error: budgetsError } = await supabase
      .from('budgets')
      .select(`
        id, company_id, project_id, nome, client_id, localizacao, tipo_obra, data_orcamento, observacoes_gerais, total_planeado, total_executado, estado, created_at, updated_at,
        clients(nome),
        budget_chapters (
          id,
          title,
          code,
          sort_order,
          notes,
          subtotal,
          budget_items (
            id,
            capitulo,
            servico,
            quantidade,
            unidade,
            preco_unitario,
            custo_planeado,
            custo_executado,
            custo_real_material,
            custo_real_mao_obra,
            estado,
            article_id
          )
        )
      `)
      .eq('company_id', userCompanyId)
      .order('created_at', { ascending: false });

    if (budgetsError) {
      toast.error(`Erro ao carregar orçamentos: ${budgetsError.message}`);
      console.error("Erro ao carregar orçamentos:", budgetsError);
      setBudgets([]);
    } else {
      // Cast budgetsData to BudgetWithRelations[]
      const fetchedBudgets: BudgetWithRelations[] = (budgetsData as BudgetWithRelations[] || []).map(budget => ({
        ...budget,
        budget_chapters: (budget.budget_chapters || []).map(chapter => ({
          ...chapter,
          budget_items: (chapter.budget_items || []).map(item => ({
            ...item,
            // Recalcular desvio no frontend, pois custo_executado pode ser atualizado
            desvio: ((item.custo_real_material || 0) + (item.custo_real_mao_obra || 0)) - item.custo_planeado, // Ensure null/undefined handling
          }))
        }))
      }));
      setBudgets(fetchedBudgets);
      // A lógica de seleção inicial/atualização será tratada no useEffect abaixo
    }
    setIsLoading(false);
  }, [userCompanyId]); // Removido selectedBudget das dependências

  React.useEffect(() => {
    fetchUserCompanyId();
  }, [fetchUserCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchClients();
      fetchBudgets();
    }
  }, [userCompanyId, fetchClients, fetchBudgets]);

  // NOVO useEffect para gerir a seleção do orçamento
  React.useEffect(() => {
    if (budgets.length > 0 && !selectedBudgetId) {
      // Se há orçamentos mas nenhum está selecionado, seleciona o primeiro
      setSelectedBudgetId(budgets[0].id);
    } else if (selectedBudgetId && !budgets.some(b => b.id === selectedBudgetId)) {
      // Se o orçamento selecionado não existe mais na lista, limpa a seleção
      setSelectedBudgetId(null);
    }
    // Se selectedBudgetId já está definido e existe na lista, não faz nada,
    // pois selectedBudget (o objeto) será automaticamente atualizado via useMemo.
  }, [budgets, selectedBudgetId]);


  const handleViewBudgetItem = (budgetItem: BudgetItem) => {
    toast.info(`Visualizar detalhes do serviço: ${budgetItem.servico}`);
    // Implement navigation to budget item detail page
  };

  const handleEditBudgetItem = (budgetItem: BudgetItem) => {
    toast.info(`Editar serviço: ${budgetItem.servico}`);
    // Implement dialog or form for editing
  };

  const handleSaveClient = async (newClient: Client) => {
    if (!user || !userCompanyId) {
      toast.error("Utilizador não autenticado ou ID da empresa não encontrado.");
      return;
    }
    try {
      const clientDataToSave = {
        ...newClient,
        company_id: userCompanyId,
        id: newClient.id || uuidv4(),
      };

      const { data, error } = await supabase
        .from('clients')
        .upsert(clientDataToSave)
        .select()
        .single();

      if (error) throw error;

      await fetchClients();
      toast.success(`Cliente ${data.nome} registado com sucesso!`);
      setIsClientDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao registar cliente: ${error.message}`);
      console.error("Erro ao registar cliente:", error);
    }
  };

  const handleSaveProject = async (newProject: Project) => {
    if (!selectedBudget?.id || !user || !userCompanyId) {
      toast.error("Nenhum orçamento aprovado para associar à obra ou ID da empresa não encontrado.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          id: newProject.id,
          nome: newProject.nome,
          client_id: newProject.client_id,
          localizacao: newProject.localizacao,
          estado: newProject.estado,
          progresso: newProject.progresso,
          prazo: newProject.prazo,
          custo_planeado: newProject.custo_planeado,
          custo_real: newProject.custo_real,
          budget_id: selectedBudget.id,
          company_id: userCompanyId,
        })
        .select()
        .single();

      if (error) throw error;

      const { error: updateBudgetError } = await supabase
        .from('budgets')
        .update({ project_id: data.id })
        .eq('id', selectedBudget.id);

      if (updateBudgetError) throw updateBudgetError;

      toast.success(`Obra "${newProject.nome}" criada e ligada ao orçamento!`);
      setIsProjectDialogOpen(false);
      fetchBudgets(); // Refresh budgets to show the linked project
      navigate(`/projects`);
    } catch (error: any) {
      toast.error(`Erro ao criar obra: ${error.message}`);
      console.error("Erro ao criar obra:", error);
    }
  };

  const handleApproveBudget = async (budgetId: string) => {
    try {
      // Recalcular o total executado para o orçamento principal antes de aprovar
      const budgetToApprove = budgets.find(b => b.id === budgetId);
      if (!budgetToApprove) {
        toast.error("Orçamento não encontrado para aprovação.");
        return;
      }
      const totalExecutedForBudget = budgetToApprove.budget_chapters.reduce((acc, chapter) => 
        acc + chapter.budget_items.reduce((itemAcc, item) => itemAcc + ((item.custo_real_material || 0) + (item.custo_real_mao_obra || 0)), 0) // Ensure null/undefined handling
      , 0);

      const { error } = await supabase
        .from('budgets')
        .update({ 
          estado: "Aprovado", 
          total_executado: totalExecutedForBudget, // NOVO: Atualizar total_executado ao aprovar
          updated_at: new Date().toISOString() 
        })
        .eq('id', budgetId);

      if (error) throw error;

      toast.success("Orçamento aprovado com sucesso!");
      fetchBudgets(); // Refresh budgets to update status
    } catch (error: any) {
      toast.error(`Erro ao aprovar orçamento: ${error.message}`);
      console.error("Erro ao aprovar orçamento:", error);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!window.confirm("Tem certeza que deseja eliminar este orçamento e todos os seus capítulos e serviços?")) return;
    try {
      // Supabase RLS should handle cascading deletes if configured,
      // but it's safer to delete child records first if not.
      // Assuming RLS is set up for cascading deletes from budgets to budget_chapters to budget_items.
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;

      toast.success("Orçamento eliminado com sucesso!");
      setSelectedBudgetId(null); // Clear selected budget ID
      fetchBudgets(); // Refresh the list
    } catch (error: any) {
      toast.error(`Erro ao eliminar orçamento: ${error.message}`);
      console.error("Erro ao eliminar orçamento:", error);
    }
  };

  const columns = createBudgetColumns({
    onView: handleViewBudgetItem,
    onEdit: handleEditBudgetItem,
  });

  // Flatten budget items for DataTable display
  const allBudgetItems: BudgetItem[] = selectedBudget
    ? selectedBudget.budget_chapters.flatMap(chapter => chapter.budget_items)
    : [];

  // Calculate KPIs from selected budget
  const totalBudget = selectedBudget ? selectedBudget.total_planeado : 0;
  const executedCost = selectedBudget ? selectedBudget.total_executado : 0; // Já vem do DB
  const budgetDeviation = executedCost - totalBudget;
  const budgetDeviationPercentage = totalBudget > 0 ? (budgetDeviation / totalBudget) * 100 : 0;
  const predictedFinalCost = totalBudget + budgetDeviation; // Simplificado
  const currentMargin = totalBudget > 0 ? ((totalBudget - executedCost) / totalBudget) * 100 : 0; // Simplificado

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
          {[...Array(5)].map((_, i) => (
            <KPICard
              key={i}
              title=""
              value=""
              description=""
              icon={Calculator}
              iconColorClass="text-transparent"
            />
          ))}
        </div>
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader><CardTitle><div className="h-6 w-48 bg-gray-200 rounded"></div></CardTitle></CardHeader>
          <CardContent>
            <div className="h-48 w-full bg-gray-100 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BudgetingHeader
        onRegisterClientClick={() => setIsClientDialogOpen(true)}
        onNewBudgetClick={() => navigate("/budgeting/new")}
      />

      <BudgetSelectionAndActions
        budgets={budgets}
        selectedBudgetId={selectedBudgetId}
        setSelectedBudgetId={setSelectedBudgetId}
        handleApproveBudget={handleApproveBudget}
        handleDeleteBudget={handleDeleteBudget}
        setIsProjectDialogOpen={setIsProjectDialogOpen}
      />

      <BudgetFinancialKPIs
        totalBudget={totalBudget}
        executedCost={executedCost}
        budgetDeviation={budgetDeviation}
        budgetDeviationPercentage={budgetDeviationPercentage}
        predictedFinalCost={predictedFinalCost}
        currentMargin={currentMargin}
      />

      <BudgetDetailTable
        allBudgetItems={allBudgetItems}
        columns={columns}
      />

      <BudgetCostControlChart />

      <BudgetIntegrations />

      <CreateEditClientDialog
        isOpen={isClientDialogOpen}
        onClose={() => setIsClientDialogOpen(false)}
        onSave={handleSaveClient}
        clientToEdit={null}
      />

      {selectedBudget && selectedBudget.estado === "Aprovado" && (
        <CreateEditProjectDialog
          isOpen={isProjectDialogOpen}
          onClose={() => setIsProjectDialogOpen(false)}
          onSave={handleSaveProject}
          projectToEdit={null}
          initialBudgetId={selectedBudget.id}
        />
      )}
    </div>
  );
};

export default Budgeting;