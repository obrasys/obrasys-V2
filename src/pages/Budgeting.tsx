"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Download, Calculator, DollarSign, FileText, TrendingUp, LineChart, HardHat, CalendarDays } from "lucide-react";
import KPICard from "@/components/KPICard";
import EmptyState from "@/components/EmptyState";
import { DataTable } from "@/components/work-items/data-table"; // Reusing generic DataTable
import { createBudgetColumns } from "@/components/budgeting/columns";
import { BudgetItem } from "@/schemas/budget-schema";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

const mockBudgetItems: BudgetItem[] = [
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
];

const Budgeting = () => {
  const [budgetItems, setBudgetItems] = React.useState<BudgetItem[]>(mockBudgetItems);

  const handleViewBudgetItem = (budgetItem: BudgetItem) => {
    toast.info(`Visualizar detalhes do serviço: ${budgetItem.servico}`);
    // Implement navigation to budget item detail page
  };

  const handleEditBudgetItem = (budgetItem: BudgetItem) => {
    toast.info(`Editar serviço: ${budgetItem.servico}`);
    // Implement dialog or form for editing
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
      <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Orçamentação e Controlo de Custos</h1>
          <p className="text-muted-foreground text-sm">
            Planeamento, acompanhamento e controlo financeiro da obra
          </p>
        </div>
        <div className="flex space-x-2">
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

      {/* KPIs Financeiros */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
          <DataTable
            columns={columns}
            data={budgetItems}
            filterColumnId="servico"
            filterPlaceholder="Filtrar por serviço..."
          />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  );
};

export default Budgeting;