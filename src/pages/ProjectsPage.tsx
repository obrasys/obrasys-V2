"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Download, HardHat, CheckCircle, AlertTriangle, TrendingUp, DollarSign, BarChart3, CalendarDays, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import KPICard from "@/components/KPICard";
import EmptyState from "@/components/EmptyState";
import { DataTable } from "@/components/work-items/data-table"; // Reusing generic DataTable
import { createProjectColumns } from "@/components/projects/columns";
import { Project } from "@/schemas/project-schema";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

const mockProjects: Project[] = [
  {
    id: uuidv4(),
    nome: "Construção Edifício Alpha",
    cliente: "Construtora XYZ",
    localizacao: "Lisboa",
    estado: "Em execução",
    progresso: 65,
    prazo: "31/12/2024",
    custo_planeado: 1500000,
    custo_real: 1450000,
  },
  {
    id: uuidv4(),
    nome: "Remodelação Apartamento T3",
    cliente: "Maria Silva",
    localizacao: "Porto",
    estado: "Concluída",
    progresso: 100,
    prazo: "15/07/2024",
    custo_planeado: 80000,
    custo_real: 82000,
  },
  {
    id: uuidv4(),
    nome: "Ampliação Armazém Beta",
    cliente: "Logística ABC",
    localizacao: "Coimbra",
    estado: "Em execução",
    progresso: 30,
    prazo: "28/02/2025",
    custo_planeado: 500000,
    custo_real: 510000,
  },
  {
    id: uuidv4(),
    nome: "Projeto Habitacional Sol",
    cliente: "Imobiliária Futuro",
    localizacao: "Faro",
    estado: "Planeada",
    progresso: 0,
    prazo: "01/03/2025",
    custo_planeado: 2000000,
    custo_real: 0,
  },
  {
    id: uuidv4(),
    nome: "Reabilitação Ponte Velha",
    cliente: "Câmara Municipal",
    localizacao: "Braga",
    estado: "Suspensa",
    progresso: 10,
    prazo: "Indefinido",
    custo_planeado: 750000,
    custo_real: 100000,
  },
];

const ProjectsPage = () => {
  const [projects, setProjects] = React.useState<Project[]>(mockProjects);

  const handleViewProject = (project: Project) => {
    toast.info(`Visualizar detalhes da obra: ${project.nome}`);
    // Implement navigation to project detail page
  };

  const handleEditProject = (project: Project) => {
    toast.info(`Editar obra: ${project.nome}`);
    // Implement dialog or form for editing
  };

  const columns = createProjectColumns({
    onView: handleViewProject,
    onEdit: handleEditProject,
  });

  // Calculate KPIs
  const activeProjects = projects.filter(p => p.estado === "Em execução").length;
  const completedProjects = projects.filter(p => p.estado === "Concluída").length;
  const delayedProjects = projects.filter(p => p.estado === "Em execução" && p.progresso < 50 && new Date(p.prazo) < new Date()).length; // Simplified logic
  const averageProgress = projects.length > 0
    ? (projects.reduce((sum, p) => sum + p.progresso, 0) / projects.length).toFixed(1)
    : "0.0";
  const totalCostDeviation = projects.reduce((sum, p) => sum + (p.custo_real - p.custo_planeado), 0);
  const formattedCostDeviation = new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(totalCostDeviation);


  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestão de Obras</h1>
          <p className="text-muted-foreground text-sm">
            Controlo total da execução, progresso e custos da obra
          </p>
        </div>
        <div className="flex space-x-2">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Nova Obra
          </Button>
          <Button variant="outline" className="flex items-center gap-2" disabled>
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline" className="flex items-center gap-2" disabled>
            <Download className="h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <KPICard
          title="Obras Ativas"
          value={activeProjects.toString()}
          description="Em andamento"
          icon={HardHat}
          iconColorClass="text-blue-500"
        />
        <KPICard
          title="Obras Concluídas"
          value={completedProjects.toString()}
          description="Finalizadas com sucesso"
          icon={CheckCircle}
          iconColorClass="text-green-500"
        />
        <KPICard
          title="Obras em Atraso"
          value={delayedProjects.toString()}
          description="Requerem atenção"
          icon={AlertTriangle}
          iconColorClass="text-orange-500"
        />
        <KPICard
          title="Progresso Médio (%)"
          value={`${averageProgress}%`}
          description="De todas as obras"
          icon={TrendingUp}
          iconColorClass="text-purple-500"
        />
        <KPICard
          title="Desvio de Custos (€)"
          value={formattedCostDeviation}
          description="Total (Real vs Planeado)"
          icon={DollarSign}
          iconColorClass={totalCostDeviation >= 0 ? "text-red-500" : "text-green-500"}
        />
      </section>

      {/* Lista / Tabela de Obras */}
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Lista de Obras</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={projects}
            filterColumnId="nome"
            filterPlaceholder="Filtrar por nome da obra..."
          />
        </CardContent>
      </Card>

      {/* Visão Rápida de Progresso */}
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Visão Rápida de Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BarChart3}
            title="Gráfico de Progresso Geral (Em breve)"
            description="Um gráfico interativo mostrará o progresso de todas as obras ao longo do tempo."
          />
        </CardContent>
      </Card>

      {/* Integração Conceitual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Ligação com Orçamento</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={DollarSign}
              title="Orçamentos Integrados (Em breve)"
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
              description="Visualize e gere o cronograma de cada obra."
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
              description="Aceda aos diários de obra e relatórios de progresso."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectsPage;