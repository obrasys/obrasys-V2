"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Download, HardHat, CheckCircle, AlertTriangle, TrendingUp, DollarSign, BarChart3, CalendarDays, FileText, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import KPICard from "@/components/KPICard";
import EmptyState from "@/components/EmptyState";
import { DataTable } from "@/components/work-items/data-table";
import { createProjectColumns } from "@/components/projects/columns";
import CreateEditProjectDialog from "@/components/projects/create-edit-project-dialog";
import ScheduleTab from "@/components/projects/schedule-tab"; // Import the new ScheduleTab
import { Project } from "@/schemas/project-schema";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";

const ProjectsPage = () => {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);
  const navigate = useNavigate();

  const fetchProjects = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*');

    if (error) {
      toast.error(`Erro ao carregar obras: ${error.message}`);
      console.error("Erro ao carregar obras:", error);
    } else {
      setProjects(data || []);
    }
  }, []);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSaveProject = async (newProject: Project) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Utilizador não autenticado.");

      const companyId = user.user_metadata.company_id;
      if (!companyId) throw new Error("ID da empresa não encontrado no perfil do utilizador.");

      const { data, error } = await supabase
        .from('projects')
        .upsert({
          ...newProject,
          company_id: companyId,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Obra "${newProject.nome}" ${newProject.id ? "atualizada" : "criada"} com sucesso!`);
      setIsProjectDialogOpen(false);
      fetchProjects(); // Refresh the list
      if (!newProject.id) { // If it's a new project, select it
        setSelectedProject(data);
      } else { // If editing, update the selected project
        setSelectedProject(data);
      }
    } catch (error: any) {
      toast.error(`Erro ao guardar obra: ${error.message}`);
      console.error("Erro ao guardar obra:", error);
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    // navigate(`/projects/${project.id}`); // Future: navigate to a dedicated detail route
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsProjectDialogOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja eliminar esta obra?")) return;
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Obra eliminada com sucesso!");
      fetchProjects();
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    } catch (error: any) {
      toast.error(`Erro ao eliminar obra: ${error.message}`);
      console.error("Erro ao eliminar obra:", error);
    }
  };

  const handleScheduleUpdate = (overallProgress: number, status: string) => {
    if (selectedProject) {
      setSelectedProject(prev => prev ? { ...prev, progresso: overallProgress, estado: status } : null);
      // Optionally, update the project in the database here
    }
  };

  const columns = createProjectColumns({
    onView: handleViewProject,
    onEdit: handleEditProject,
    onDelete: handleDeleteProject, // Pass delete handler
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

  if (selectedProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
          <Button variant="ghost" onClick={() => setSelectedProject(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar à Lista de Obras
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">{selectedProject.nome}</h1>
            <p className="text-muted-foreground text-sm">Detalhes da Obra</p>
          </div>
          <Button onClick={() => handleEditProject(selectedProject)} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Editar Obra
          </Button>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4"> {/* Adjusted for 4 tabs */}
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="budget">Orçamento</TabsTrigger>
            <TabsTrigger value="schedule" disabled={!selectedProject.budget_id}>Cronograma</TabsTrigger> {/* Disabled if no budget */}
            <TabsTrigger value="rdo">RDO</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card>
              <CardHeader><CardTitle>Visão Geral da Obra</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold">Cliente:</span> {selectedProject.cliente}</div>
                <div><span className="font-semibold">Localização:</span> {selectedProject.localizacao}</div>
                <div><span className="font-semibold">Estado:</span> {selectedProject.estado}</div>
                <div><span className="font-semibold">Progresso:</span> {selectedProject.progresso}%</div>
                <div><span className="font-semibold">Prazo:</span> {selectedProject.prazo}</div>
                <div><span className="font-semibold">Custo Planeado:</span> {formatCurrency(selectedProject.custo_planeado)}</div>
                <div><span className="font-semibold">Custo Real:</span> {formatCurrency(selectedProject.custo_real)}</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="budget">
            <Card>
              <CardHeader><CardTitle>Orçamento da Obra</CardTitle></CardHeader>
              <CardContent>
                {selectedProject.budget_id ? (
                  <EmptyState
                    icon={DollarSign}
                    title="Detalhes do Orçamento (Em breve)"
                    description="Aqui serão exibidos os detalhes do orçamento ligado a esta obra."
                  />
                ) : (
                  <EmptyState
                    icon={DollarSign}
                    title="Nenhum orçamento associado"
                    description="Esta obra ainda não tem um orçamento aprovado e ligado."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="schedule">
            {selectedProject.budget_id ? (
              <ScheduleTab
                projectId={selectedProject.id}
                budgetId={selectedProject.budget_id}
                onScheduleUpdate={handleScheduleUpdate}
              />
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="Cronograma não disponível"
                description="O cronograma só pode ser gerado para obras com um orçamento aprovado e associado."
              />
            )}
          </TabsContent>
          <TabsContent value="rdo">
            <Card>
              <CardHeader><CardTitle>Diários de Obra (RDO)</CardTitle></CardHeader>
              <CardContent>
                <EmptyState
                  icon={FileText}
                  title="Diários de Obra (Em breve)"
                  description="Aqui serão geridos os diários de obra para esta obra."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CreateEditProjectDialog
          isOpen={isProjectDialogOpen}
          onClose={() => setIsProjectDialogOpen(false)}
          onSave={handleSaveProject}
          projectToEdit={selectedProject}
          initialBudgetId={selectedProject.budget_id}
        />
      </div>
    );
  }

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
          <Button onClick={() => { setSelectedProject(null); setIsProjectDialogOpen(true); }} className="flex items-center gap-2">
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
          {projects.length > 0 ? (
            <DataTable
              columns={columns}
              data={projects}
              filterColumnId="nome"
              filterPlaceholder="Filtrar por nome da obra..."
            />
          ) : (
            <EmptyState
              icon={HardHat}
              title="Nenhuma obra encontrada"
              description="Comece por criar uma nova obra para gerir os seus projetos."
              buttonText="Nova Obra"
              onButtonClick={() => { setSelectedProject(null); setIsProjectDialogOpen(true); }}
            />
          )}
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

      <CreateEditProjectDialog
        isOpen={isProjectDialogOpen}
        onClose={() => setIsProjectDialogOpen(false)}
        onSave={handleSaveProject}
        projectToEdit={selectedProject}
      />
    </div>
  );
};

export default ProjectsPage;