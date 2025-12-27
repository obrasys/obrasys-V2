"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Download, HardHat, CheckCircle, AlertTriangle, TrendingUp, DollarSign, BarChart3, CalendarDays, FileText, ArrowLeft, Loader2, Edit } from "lucide-react"; // Adicionado Edit
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import KPICard from "@/components/KPICard";
import EmptyState from "@/components/EmptyState";
import { DataTable } from "@/components/work-items/data-table"; // Reusing generic DataTable
import { createProjectColumns } from "@/components/projects/columns";
import CreateEditProjectDialog from "@/components/projects/create-edit-project-dialog";
import ScheduleTab from "@/components/projects/schedule-tab";
import ProjectBudgetDetails from "@/components/projects/ProjectBudgetDetails"; // NEW: Import ProjectBudgetDetails
import { Project } from "@/schemas/project-schema";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrency, formatDate } from "@/utils/formatters"; // Importar formatCurrency e formatDate
import NavButton from "@/components/NavButton"; // Importar NavButton
import { useSession } from "@/components/SessionContextProvider"; // Importar useSession
import { LivroObra } from "@/schemas/compliance-schema"; // Importar LivroObra
import { format, parseISO } from "date-fns"; // Importar format e parseISO
import { Profile } from "@/schemas/profile-schema"; // Import Profile schema

const ProjectsPage = () => {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);
  const navigate = useNavigate();
  const { user, profile, isLoading: isSessionLoading } = useSession(); // Obter user e profile da sessão
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);

  // Estados locais para Livro de Obra e status do orçamento
  const [livrosObraForProject, setLivrosObraForProject] = React.useState<LivroObra[]>([]);
  const [isLoadingLivrosObraForProject, setIsLoadingLivrosObraForProject] = React.useState(true);
  const [selectedBudgetStatus, setSelectedBudgetStatus] = React.useState<string | null>(null);
  const [isLoadingBudgetStatus, setIsLoadingBudgetStatus] = React.useState(true);
  const [isCreatingLivroObra, setIsCreatingLivroObra] = React.useState(false);


  const userPlanType = profile?.plan_type || 'trialing';
  const isInitiantePlan = userPlanType === 'iniciante' || userPlanType === 'trialing';
  const isProfessionalPlan = userPlanType === 'profissional' || userPlanType === 'empresa';

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

  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
  }, [isSessionLoading, fetchUserCompanyId]);


  const fetchProjects = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, clients(nome)'); // Seleciona tudo de projects e faz join com clients para obter o nome

    if (error) {
      toast.error(`Erro ao carregar obras: ${error.message}`);
      console.error("Erro ao carregar obras:", error);
    } else {
      const formattedProjects: Project[] = (data || []).map((project: any) => ({
        ...project,
        client_name: project.clients?.nome || "Cliente Desconhecido", // Extrai o nome do cliente
      }));
      setProjects(formattedProjects);
      // Se um projeto estava selecionado, atualiza-o com os novos dados
      if (selectedProject) {
        const updatedSelected = formattedProjects.find(p => p.id === selectedProject.id);
        if (updatedSelected) {
          setSelectedProject(updatedSelected);
        }
      }
    }
  }, [selectedProject]); // Adicionar selectedProject como dependência para atualizar o projeto selecionado

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const fetchLivrosObraForProject = React.useCallback(async () => {
    if (!selectedProject?.id || !userCompanyId) {
      setLivrosObraForProject([]);
      return;
    }
    setIsLoadingLivrosObraForProject(true);
    const { data, error } = await supabase
      .from('livros_obra')
      .select('*')
      .eq('project_id', selectedProject.id)
      .eq('company_id', userCompanyId)
      .order('periodo_inicio', { ascending: false });

    if (error) {
      toast.error(`Erro ao carregar Livros de Obra para o projeto: ${error.message}`);
      console.error("Erro ao carregar Livros de Obra:", error);
      setLivrosObraForProject([]);
    } else {
      setLivrosObraForProject(data || []);
    }
    setIsLoadingLivrosObraForProject(false);
  }, [selectedProject?.id, userCompanyId]);

  React.useEffect(() => {
    if (selectedProject?.id) {
      fetchLivrosObraForProject();
    }
  }, [selectedProject?.id, fetchLivrosObraForProject]);

  // NEW: Fetch budget status for the selected project
  const fetchSelectedBudgetStatus = React.useCallback(async () => {
    if (!selectedProject?.budget_id) {
      setSelectedBudgetStatus(null);
      return;
    }
    setIsLoadingBudgetStatus(true);
    const { data, error } = await supabase
      .from('budgets')
      .select('estado')
      .eq('id', selectedProject.budget_id)
      .single();

    if (error) {
      console.error("Error fetching selected budget status:", error);
      setSelectedBudgetStatus(null);
    } else if (data) {
      setSelectedBudgetStatus(data.estado);
    }
    setIsLoadingBudgetStatus(false);
  }, [selectedProject?.budget_id]);

  React.useEffect(() => {
    if (selectedProject?.budget_id) {
      fetchSelectedBudgetStatus();
    }
  }, [selectedProject?.budget_id, fetchSelectedBudgetStatus]);

  const handleCreateLivroObraForProject = async () => {
    if (!selectedProject || !userCompanyId) {
      toast.error("Selecione um projeto e certifique-se de que a empresa está associada.");
      return;
    }

    if (isInitiantePlan && livrosObraForProject.length >= 1) {
      toast.error("O seu plano 'Iniciante' permite um máximo de 1 Livro de Obra por projeto. Faça upgrade para criar mais.");
      navigate("/plans");
      return;
    }

    setIsCreatingLivroObra(true);
    try {
      const today = new Date();
      const defaultEndDate = selectedProject.prazo && !isNaN(new Date(selectedProject.prazo).getTime())
        ? format(parseISO(selectedProject.prazo), "yyyy-MM-dd")
        : format(new Date(today.setFullYear(today.getFullYear() + 1)), "yyyy-MM-dd"); // 1 year from now

      const newLivro: LivroObra = {
        id: uuidv4(),
        company_id: userCompanyId,
        project_id: selectedProject.id,
        budget_id: selectedProject.budget_id,
        periodo_inicio: format(new Date(), "yyyy-MM-dd"),
        periodo_fim: defaultEndDate,
        estado: "em_preparacao",
        observacoes: `Livro de Obra inicial para o projeto ${selectedProject.nome}`,
      };

      const { error } = await supabase
        .from('livros_obra')
        .insert(newLivro);

      if (error) throw error;

      toast.success("Livro de Obra criado com sucesso!");
      fetchLivrosObraForProject(); // Refresh the list
    } catch (error: any) {
      toast.error(`Erro ao criar Livro de Obra: ${error.message}`);
      console.error("Erro ao criar Livro de Obra:", error);
    } finally {
      setIsCreatingLivroObra(false);
    }
  };

  const handleSaveProject = async (newProject: Project) => {
    try {
      if (!user || !userCompanyId) throw new Error("Utilizador não autenticado ou ID da empresa não encontrado.");

      if (isInitiantePlan && !newProject.id && projects.filter(p => p.estado !== 'Concluída').length >= 5) {
        toast.error("O seu plano 'Iniciante' permite um máximo de 5 obras ativas. Faça upgrade para criar mais.");
        navigate("/plans");
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .upsert({
          ...newProject,
          company_id: userCompanyId,
          // client_id já está em newProject do formulário
        })
        .select('*, clients(nome)') // Seleciona com join para obter client_name de volta
        .single();

      if (error) throw error;

      const savedProject: Project = {
        ...data,
        client_name: (data as any).clients?.nome || "Cliente Desconhecido",
      };

      toast.success(`Obra "${savedProject.nome}" ${savedProject.id ? "atualizada" : "criada"} com sucesso!`);
      setIsProjectDialogOpen(false);
      fetchProjects(); // Atualiza a lista
      setSelectedProject(savedProject); // Atualiza o projeto selecionado com client_name
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

  const columns = createProjectColumns({
    onView: handleViewProject,
    onEdit: handleEditProject,
    onDelete: handleDeleteProject,
  });

  // Calculate KPIs
  const activeProjects = projects.filter(p => p.estado === "Em execução").length;
  const completedProjects = projects.filter(p => p.estado === "Concluída").length;
  const delayedProjects = projects.filter(p => p.estado === "Atrasada").length; // Usar o novo estado 'Atrasada'
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          {/* Left side: Project Name and Description */}
          <div className="flex flex-col text-center md:text-left mb-2 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-primary">{selectedProject.nome}</h1>
            <p className="text-muted-foreground text-sm">Detalhes da Obra</p>
          </div>

          {/* Right side: Buttons */}
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0 ml-auto">
            <Button variant="ghost" onClick={() => setSelectedProject(null)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Voltar à Lista de Obras
            </Button>
            <Button onClick={() => handleEditProject(selectedProject)} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" /> Editar Obra
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4"> {/* Ajustado para 2 colunas em mobile, 4 em sm+ */}
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="budget">Orçamento</TabsTrigger>
            <TabsTrigger value="schedule" disabled={!selectedProject.budget_id || isInitiantePlan}>Cronograma</TabsTrigger>
            <TabsTrigger value="rdo">RDO</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card>
              <CardHeader><CardTitle>Visão Geral da Obra</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><span className="font-semibold">Cliente:</span> {selectedProject.client_name || "N/A"}</div> {/* Usando client_name */}
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
            {selectedProject.budget_id && selectedProject.id ? (
              <>
                <div className="flex justify-end mb-4">
                  <Button
                    onClick={() => navigate(`/budgeting/edit/${selectedProject.budget_id}`)}
                    disabled={isLoadingBudgetStatus || selectedBudgetStatus === "Aprovado"}
                    className="flex items-center gap-2"
                  >
                    {isLoadingBudgetStatus ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4 mr-2" />
                    )}
                    Editar Orçamento
                  </Button>
                </div>
                <ProjectBudgetDetails budgetId={selectedProject.budget_id} projectId={selectedProject.id} />
              </>
            ) : (
              <EmptyState
                icon={DollarSign}
                title="Nenhum orçamento associado"
                description="Esta obra ainda não tem um orçamento aprovado e ligado."
              />
            )}
          </TabsContent>
          <TabsContent value="schedule">
            {isInitiantePlan ? (
              <EmptyState
                icon={CalendarDays}
                title="Funcionalidade não disponível no seu plano"
                description="A gestão de cronogramas está disponível apenas para planos Profissional e Empresa. Faça upgrade para aceder a esta funcionalidade."
                buttonText="Ver Planos"
                onButtonClick={() => navigate("/plans")}
              />
            ) : selectedProject.budget_id ? (
              <ScheduleTab
                projectId={selectedProject.id}
                budgetId={selectedProject.budget_id}
                onScheduleRefetch={fetchProjects} // Passar fetchProjects para atualizar o projeto pai
                userCompanyId={userCompanyId} // Passar userCompanyId
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
            {isInitiantePlan ? (
              <EmptyState
                icon={FileText}
                title="Funcionalidade não disponível no seu plano"
                description="A gestão de RDOs está disponível apenas para planos Profissional e Empresa. Faça upgrade para aceder a esta funcionalidade."
                buttonText="Ver Planos"
                onButtonClick={() => navigate("/plans")}
              />
            ) : (
              <Card>
                <CardHeader><CardTitle>Diários de Obra (RDO)</CardTitle></CardHeader>
                <CardContent>
                  {isLoadingLivrosObraForProject ? (
                    <div className="flex justify-center items-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    livrosObraForProject.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Existem {livrosObraForProject.length} Livro(s) de Obra associado(s) a este projeto.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {livrosObraForProject.slice(0, 2).map(livro => ( // Show up to 2 recent ones
                            <Card key={livro.id} className="p-4">
                              <h4 className="font-semibold">Livro de Obra: {formatDate(livro.periodo_inicio)} - {formatDate(livro.periodo_fim)}</h4>
                              <p className="text-sm text-muted-foreground">Estado: {livro.estado}</p>
                            </Card>
                          ))}
                        </div>
                        <Button onClick={() => navigate(`/compliance/livro-de-obra?projectId=${selectedProject.id}`)} className="w-full mt-4">
                          <FileText className="h-4 w-4 mr-2" /> Ver Todos os Livros de Obra
                        </Button>
                      </div>
                    ) : (
                      <EmptyState
                        icon={FileText}
                        title="Nenhum Livro de Obra encontrado"
                        description="Crie o primeiro Livro de Obra para este projeto para começar a gerir os registos diários."
                        buttonText="Criar Livro de Obra"
                        onButtonClick={handleCreateLivroObraForProject}
                        buttonDisabled={isCreatingLivroObra}
                      />
                    )
                  )}
                </CardContent>
              </Card>
            )}
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Gestão de Obras</h1>
          <p className="text-muted-foreground text-sm">
            Controlo total da execução, progresso e custos da obra
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Button onClick={() => {
            if (isInitiantePlan && projects.filter(p => p.estado !== 'Concluída').length >= 5) {
              toast.error("O seu plano 'Iniciante' permite um máximo de 5 obras ativas. Faça upgrade para criar mais.");
              navigate("/plans");
            } else {
              setSelectedProject(null);
              setIsProjectDialogOpen(true);
            }
          }} className="flex items-center gap-2">
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
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
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

      {/* Lista de Obras */}
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
              onButtonClick={() => {
                if (isInitiantePlan && projects.filter(p => p.estado !== 'Concluída').length >= 5) {
                  toast.error("O seu plano 'Iniciante' permite um máximo de 5 obras ativas. Faça upgrade para criar mais.");
                  navigate("/plans");
                } else {
                  setSelectedProject(null);
                  setIsProjectDialogOpen(true);
                }
              }}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
            {isInitiantePlan ? (
              <EmptyState
                icon={CalendarDays}
                title="Funcionalidade não disponível"
                description="A gestão de cronogramas está disponível apenas para planos Profissional e Empresa."
                buttonText="Ver Planos"
                onButtonClick={() => navigate("/plans")}
              />
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="Cronogramas Detalhados (Em breve)"
                description="Visualize e gere o cronograma de cada obra."
              />
            )}
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Ligação com RDO</CardTitle>
          </CardHeader>
          <CardContent>
            {isInitiantePlan ? (
              <EmptyState
                icon={FileText}
                title="Funcionalidade não disponível"
                description="A gestão de RDOs está disponível apenas para planos Profissional e Empresa."
                buttonText="Ver Planos"
                onButtonClick={() => navigate("/plans")}
              />
            ) : (
              <EmptyState
                icon={FileText}
                title="Diários de Obra (Em breve)"
                description="Aceda aos diários de obra e relatórios de progresso."
              />
            )}
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