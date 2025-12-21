"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Download, Calculator, DollarSign, FileText, TrendingUp, LineChart, HardHat, CalendarDays, UserPlus, Check } from "lucide-react";
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

// Mock data for budgets (assuming a full budget object, not just items)
interface Budget {
  id: string;
  nome: string;
  project_id: string | null;
  estado: "Rascunho" | "Aprovado" | "Rejeitado"; // Adicionado estado do orçamento
  total_planeado: number;
  total_executado: number;
  budget_items: BudgetItem[];
}

const mockBudgets: Budget[] = [
  {
    id: uuidv4(),
    nome: "Orçamento Edifício Central",
    project_id: null,
    estado: "Rascunho",
    total_planeado: 12650.00,
    total_executado: 8000.00,
    budget_items: [
      {
        id: uuidv4(),
        capitulo: "01. Fundações",
        servico: "Escavação manual em vala",
        quantidade: 50,
        unidade: "m³",
        preco_unitario: 15.00,
        custo_planeado: 750.00,
        custo_executado: 700.00,
        desvio: -50.00,
        estado: "Concluído",
      },
      {
        id: uuidv4(),
        capitulo: "01. Fundações",
        servico: "Betão C20/25 para sapatas",
        quantidade: 20,
        unidade: "m³",
        preco_unitario: 120.00,
        custo_planeado: 2400.00,
        custo_executado: 2500.00,
        desvio: 100.00,
        estado: "Em andamento",
      },
      {
        id: uuidv4(),
        capitulo: "02. Estrutura",
        servico: "Armadura em aço A500 NR",
        quantidade: 1500,
        unidade: "kg",
        preco_unitario: 1.80,
        custo_planeado: 2700.00,
        custo_executado: 2800.00,
        desvio: 100.00,
        estado: "Em andamento",
      },
      {
        id: uuidv4(),
        capitulo: "03. Alvenarias",
        servico: "Alvenaria de tijolo cerâmico 11cm",
        quantidade: 200,
        unidade: "m²",
        preco_unitario: 25.00,
        custo_planeado: 5000.00,
        custo_executado: 4800.00,
        desvio: -200.00,
        estado: "Concluído",
      },
      {
        id: uuidv4(),
        capitulo: "04. Cobertura",
        servico: "Telha cerâmica lusa",
        quantidade: 100,
        unidade: "m²",
        preco_unitario: 18.00,
        custo_planeado: 1800.00,
        custo_executado: 0.00,
        desvio: -1800.00,
        estado: "Atrasado",
      },
    ],
  },
  {
    id: uuidv4(),
    nome: "Orçamento Remodelação Escritório",
    project_id: null,
    estado: "Aprovado", // Exemplo de orçamento aprovado
    total_planeado: 50000.00,
    total_executado: 0.00,
    budget_items: [
      {
        id: uuidv4(),
        capitulo: "01. Demolições",
        servico: "Remoção de paredes divisórias",
        quantidade: 30,
        unidade: "m²",
        preco_unitario: 20.00,
        custo_planeado: 600.00,
        custo_executado: 0.00,
        desvio: 0.00,
        estado: "Planeado",
      },
      {
        id: uuidv4(),
        capitulo: "02. Acabamentos",
        servico: "Pintura de paredes e tetos",
        quantidade: 200,
        unidade: "m²",
        preco_unitario: 10.00,
        custo_planeado: 2000.00,
        custo_executado: 0.00,
        desvio: 0.00,
        estado: "Planeado",
      },
    ],
  },
];

const Budgeting = () => {
  const [budgets, setBudgets] = React.useState<Budget[]>(mockBudgets);
  const [selectedBudget, setSelectedBudget] = React.useState<Budget | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = React.useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);
  const [clients, setClients] = React.useState<Client[]>([]); // State to store registered clients

  // Use a default budget if none is selected, or the first one
  const currentBudget = selectedBudget || budgets[0];
  const budgetItems = currentBudget ? currentBudget.budget_items : [];

  const handleViewBudgetItem = (budgetItem: BudgetItem) => {
    toast.info(`Visualizar detalhes do serviço: ${budgetItem.servico}`);
    // Implement navigation to budget item detail page
  };

  const handleEditBudgetItem = (budgetItem: BudgetItem) => {
    toast.info(`Editar serviço: ${budgetItem.servico}`);
    // Implement dialog or form for editing
  };

  const handleSaveClient = (newClient: Client) => {
    setClients((prevClients) => {
      if (newClient.id && prevClients.some((c) => c.id === newClient.id)) {
        return prevClients.map((c) => (c.id === newClient.id ? newClient : c));
      }
      return [...prevClients, newClient];
    });
    console.log("Cliente guardado:", newClient);
  };

  const handleSaveProject = async (newProject: Project) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          id: newProject.id,
          nome: newProject.nome,
          client_id: null, // Assuming client_id is handled elsewhere or can be null initially
          localizacao: newProject.localizacao,
          estado: newProject.estado,
          progresso: newProject.progresso,
          prazo: newProject.prazo,
          custo_planeado: newProject.custo_planeado,
          custo_real: newProject.custo_real,
          budget_id: newProject.budget_id, // Link the budget
          company_id: (await supabase.auth.getUser()).data.user?.user_metadata.company_id, // Assuming company_id is in user metadata
        })
        .select()
        .single();

      if (error) throw error;

      // Update the local budget state to link the project
      setBudgets(prevBudgets =>
        prevBudgets.map(b =>
          b.id === newProject.budget_id ? { ...b, project_id: data.id } : b
        )
      );
      toast.success(`Obra "${newProject.nome}" criada e ligada ao orçamento!`);
      setIsProjectDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao criar obra: ${error.message}`);
      console.error("Erro ao criar obra:", error);
    }
  };

  const handleApproveBudget = (budgetId: string) => {
    setBudgets(prevBudgets =>
      prevBudgets.map(b =>
        b.id === budgetId ? { ...b, estado: "Aprovado" } : b
      )
    );
    toast.success("Orçamento aprovado com sucesso!");
  };

  const columns = createBudgetColumns({
    onView: handleViewBudgetItem,
    onEdit: handleEditBudgetItem,
  });

  // Calculate KPIs
  const totalBudget = budgetItems.reduce((sum, item) => sum + item.custo_planeado, 0);
  const executedCost = budgetItems.reduce((sum, item) => sum + item.custo_executado, 0);
  const budgetDeviation = executedCost - totalBudget;
  const budgetDeviationPercentage = totalBudget > 0 ? (budgetDeviation / totalBudget) * 100 : 0;
  const predictedFinalCost = totalBudget + budgetDeviation; // Simplified prediction
  const currentMargin = totalBudget > 0 ? ((totalBudget - executedCost) / totalBudget) * 100 : 0; // Simplified margin

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);

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
          <Button className="flex items-center gap-2">
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
          <CardTitle className="text-lg sm:text-xl font-semibold">Gerir Orçamentos</CardTitle> {/* Ajuste de tamanho de texto */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={currentBudget?.id || ""}
              onValueChange={(budgetId) => setSelectedBudget(budgets.find(b => b.id === budgetId) || null)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecione um Orçamento">
                  {currentBudget ? currentBudget.nome : "Selecione um Orçamento"}
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
            {currentBudget && currentBudget.estado === "Rascunho" && (
              <Button onClick={() => handleApproveBudget(currentBudget.id)} className="flex items-center gap-2">
                <Check className="h-4 w-4" /> Aprovar Orçamento
              </Button>
            )}
            {currentBudget && currentBudget.estado === "Aprovado" && !currentBudget.project_id && (
              <Button onClick={() => setIsProjectDialogOpen(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                <HardHat className="h-4 w-4" /> Criar Obra
              </Button>
            )}
            {currentBudget && currentBudget.project_id && (
              <Button variant="outline" disabled className="flex items-center gap-2">
                <HardHat className="h-4 w-4" /> Obra Associada
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentBudget ? (
            <p className="text-sm text-muted-foreground">
              Orçamento selecionado: <span className="font-medium">{currentBudget.nome}</span> - Estado: <span className="font-medium">{currentBudget.estado}</span>
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
          <CardTitle className="text-xl sm:text-2xl font-semibold">Detalhe do Orçamento</CardTitle> {/* Ajuste de tamanho de texto */}
        </CardHeader>
        <CardContent>
          {budgetItems.length > 0 ? (
            <DataTable
              columns={columns}
              data={budgetItems}
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
          <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-2"> {/* Ajuste de tamanho de texto */}
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
            <CardTitle className="text-lg sm:text-xl font-semibold">Ligação com Gestão de Obras</CardTitle> {/* Ajuste de tamanho de texto */}
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
            <CardTitle className="text-lg sm:text-xl font-semibold">Ligação com Cronograma</CardTitle> {/* Ajuste de tamanho de texto */}
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
            <CardTitle className="text-lg sm:text-xl font-semibold">Ligação com RDO</CardTitle> {/* Ajuste de tamanho de texto */}
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

      {currentBudget && currentBudget.estado === "Aprovado" && (
        <CreateEditProjectDialog
          isOpen={isProjectDialogOpen}
          onClose={() => setIsProjectDialogOpen(false)}
          onSave={handleSaveProject}
          projectToEdit={null}
          initialBudgetId={currentBudget.id}
        />
      )}
    </div>
  );
};

export default Budgeting;