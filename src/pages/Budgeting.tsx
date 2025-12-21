"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Download, Calculator, DollarSign, FileText, TrendingUp, LineChart, HardHat, CalendarDays, UserPlus, Check, Trash2 } from "lucide-react";
import KPICard from "@/components/KPICard";
import EmptyState from "@/components/EmptyState";
import { DataTable } from "@/components/work-items/data-table"; // Reusing generic DataTable
import { createBudgetColumns } from "@/components/budgeting/columns";
import { BudgetItem } from "@/schemas/budget-schema";
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

// Definir a interface para o orçamento completo, incluindo capítulos e itens
interface Budget {
  id: string;
  nome: string;
  client_id: string | null;
  clients: { nome: string } | null; // Para o join do nome do cliente
  project_id: string | null;
  estado: "Rascunho" | "Aprovado" | "Rejeitado";
  total_planeado: number;
  total_executado: number;
  budget_chapters: BudgetChapter[];
  created_at: string;
  updated_at: string;
}

interface BudgetChapter {
  id: string;
  title: string;
  code: string;
  sort_order: number;
  notes: string | null;
  subtotal: number;
  budget_items: BudgetItem[];
}

const Budgeting = () => {
  const [budgets, setBudgets] = React.useState<Budget[]>([]);
  const [selectedBudget, setSelectedBudget] = React.useState<Budget | null>(null);
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
      setSelectedBudget(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data: budgetsData, error: budgetsError } = await supabase
      .from('budgets')
      .select(`
        *,
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
            desvio,
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
      const fetchedBudgets: Budget[] = (budgetsData || []).map(budget => ({
        ...budget,
        budget_chapters: (budget.budget_chapters || []).map(chapter => ({
          ...chapter,
          budget_items: chapter.budget_items || []
        }))
      }));
      setBudgets(fetchedBudgets);
      if (fetchedBudgets.length > 0 && !selectedBudget) {
        setSelectedBudget(fetchedBudgets[0]);
      } else if (selectedBudget) {
        // If a budget was already selected, try to re-select it to update its data
        const updatedSelected = fetchedBudgets.find(b => b.id === selectedBudget.id);
        setSelectedBudget(updatedSelected || null);
      }
    }
    setIsLoading(false);
  }, [userCompanyId, selectedBudget]);

  React.useEffect(() => {
    fetchUserCompanyId();
  }, [fetchUserCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchClients();
      fetchBudgets();
    }
  }, [userCompanyId, fetchClients, fetchBudgets]);

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
      const { error } = await supabase
        .from('budgets')
        .update({ estado: "Aprovado", updated_at: new Date().toISOString() })
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
      setSelectedBudget(null); // Clear selected budget
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
  const executedCost = selectedBudget ? selectedBudget.total_executado : 0;
  const budgetDeviation = executedCost - totalBudget;
  const budgetDeviationPercentage = totalBudget > 0 ? (budgetDeviation / totalBudget) * 100 : 0;
  const predictedFinalCost = totalBudget + budgetDeviation; // Simplified prediction
  const currentMargin = totalBudget > 0 ? ((totalBudget - executedCost) / totalBudget) * 100 : 0; // Simplified margin

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
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Orçamentação e Controlo de Custos</h1>
          <p className="text-muted-foreground text-sm">
            Planeamento, acompanhamento e controlo financeiro da obra
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Button onClick={() => setIsClientDialogOpen(true)} variant="outline" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Cadastrar Cliente
          </Button>
          <Button onClick={() => navigate("/budgeting/new")} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Novo Orçamento
          </Button>
          <Button variant="outline" className="flex items-center gap-2" disabled>
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline" className="flex items-center gap-2" disabled>
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* Seleção de Orçamento e Ações */}
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">Gerir Orçamentos</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedBudget?.id || ""}
              onValueChange={(budgetId) => setSelectedBudget(budgets.find(b => b.id === budgetId) || null)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecione um Orçamento">
                  {selectedBudget ? selectedBudget.nome : "Selecione um Orçamento"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.nome} ({budget.estado})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBudget && selectedBudget.estado === "Rascunho" && (
              <Button onClick={() => handleApproveBudget(selectedBudget.id)} className="flex items-center gap-2">
                <Check className="h-4 w-4" /> Aprovar Orçamento
              </Button>
            )}
            {selectedBudget && selectedBudget.estado === "Aprovado" && !selectedBudget.project_id && (
              <Button onClick={() => setIsProjectDialogOpen(true)} className="flex items-center gap-2">
                <HardHat className="h-4 w-4" /> Criar Obra
              </Button>
            )}
            {selectedBudget && selectedBudget.project_id && (
              <Button variant="outline" disabled className="flex items-center gap-2">
                <HardHat className="h-4 w-4" /> Obra Associada
              </Button>
            )}
            {selectedBudget && (
              <Button variant="destructive" onClick={() => handleDeleteBudget(selectedBudget.id)} className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Eliminar Orçamento
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedBudget ? (
            <p className="text-sm text-muted-foreground">
              Orçamento selecionado: <span className="font-medium">{selectedBudget.nome}</span> - Estado: <span className="font-medium">{selectedBudget.estado}</span>
            </p>
          ) : (
            <EmptyState
              icon={Calculator}
              title="Nenhum orçamento selecionado"
              description="Selecione um orçamento para ver os detalhes ou crie um novo."
            />
          )}
        </CardContent>
      </Card>

      {/* KPIs Financeiros */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
        <KPICard
          title="Orçamento Total (€)"
          value={formatCurrency(totalBudget)}
          description="Valor planeado para a obra"
          icon={Calculator}
          iconColorClass="text-blue-500"
        />
        <KPICard
          title="Custo Executado (€)"
          value={formatCurrency(executedCost)}
          description="Valor já gasto"
          icon={DollarSign}
          iconColorClass="text-green-500"
        />
        <KPICard
          title="Desvio Orçamental (€ / %)"
          value={`${formatCurrency(budgetDeviation)} (${budgetDeviationPercentage.toFixed(1)}%)`}
          description="Diferença entre planeado e executado"
          icon={TrendingUp}
          iconColorClass={budgetDeviation >= 0 ? "text-red-500" : "text-green-500"}
        />
        <KPICard
          title="Custo Previsto Final (€)"
          value={formatCurrency(predictedFinalCost)}
          description="Estimativa de custo total"
          icon={LineChart}
          iconColorClass="text-purple-500"
        />
        <KPICard
          title="Margem Atual (%)"
          value={`${currentMargin.toFixed(1)}%`}
          description="Margem de lucro atual"
          icon={DollarSign}
          iconColorClass={currentMargin >= 0 ? "text-green-500" : "text-red-500"}
        />
      </section>

      {/* Lista de Orçamentos / Capítulos */}
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Detalhe do Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          {allBudgetItems.length > 0 ? (
            <DataTable
              columns={columns}
              data={allBudgetItems}
              filterColumnId="servico"
              filterPlaceholder="Filtrar por serviço..."
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="Nenhum item de orçamento"
              description="Adicione itens para detalhar o seu orçamento."
            />
          )}
        </CardContent>
      </Card>

      {/* Controlo de Custos (Gráfico) */}
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" /> Controlo de Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={LineChart}
            title="Gráfico de Comparativo de Custos (Em breve)"
            description="Um gráfico interativo mostrará o comparativo entre o custo planeado e o custo executado."
          />
        </CardContent>
      </Card>

      {/* Integrações Conceituais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Ligação com Gestão de Obras</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={HardHat}
              title="Obras Integradas (Em breve)"
              description="Acompanhe os orçamentos de cada obra diretamente aqui."
            />
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Ligação com Cronograma</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={CalendarDays}
              title="Cronogramas Detalhados (Em breve)"
              description="Visualize e gere o cronograma financeiro de cada obra."
            />
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Ligação com RDO</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={FileText}
              title="Diários de Obra (Em breve)"
              description="Aceda aos diários de obra e relatórios de progresso financeiro."
            />
          </CardContent>
        </Card>
      </div>

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