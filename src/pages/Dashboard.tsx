"use client";

import React from "react";
import KPICard from "@/components/KPICard";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  HardHat,
  AlertTriangle,
  FileText,
  CalendarDays,
  CheckSquare,
  Plus,
  Users,
  Calculator,
  Upload,
  Bell,
  RefreshCw,
  Settings,
  Loader2, // Import Loader2 for loading state
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import NavButton from "@/components/NavButton";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Project } from "@/schemas/project-schema"; // Import Project schema
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading states

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(true);

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

  // Fetch projects for the current company
  const fetchProjects = React.useCallback(async () => {
    if (!userCompanyId) {
      setProjects([]);
      setIsLoadingProjects(false);
      return;
    }
    setIsLoadingProjects(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, nome, estado, progresso, custo_planeado, custo_real')
      .eq('company_id', userCompanyId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Erro ao carregar obras: ${error.message}`);
      console.error("Erro ao carregar obras:", error);
      setProjects([]);
    } else {
      setProjects(data || []);
    }
    setIsLoadingProjects(false);
  }, [userCompanyId]);

  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
  }, [isSessionLoading, fetchUserCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchProjects();
    }
  }, [userCompanyId, fetchProjects]);

  const activeProjects = projects.filter(p => p.estado === "Em execução");
  const delayedProjects = projects.filter(p => p.estado === "Atrasada");

  // Placeholder for user name, replace with actual profile data if available
  const userName = "Bezerra Cavalcanti"; // Replace with profile?.first_name + ' ' + profile?.last_name

  return (
    <div className="space-y-6">
      {/* Header - now specific to Dashboard content */}
      <div className="flex flex-col md:flex-row items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            Bem-vindo, {userName}
          </h1>
          <p className="text-muted-foreground text-sm">Administrador</p>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
        <KPICard
          title="Obras Ativas"
          value={isLoadingProjects ? <Loader2 className="h-5 w-5 animate-spin" /> : activeProjects.length.toString()}
          description="+2 esta semana" // This would need actual data to be dynamic
          icon={HardHat}
          iconColorClass="text-blue-500"
        />
        <KPICard
          title="Obras em Atraso"
          value={isLoadingProjects ? <Loader2 className="h-5 w-5 animate-spin" /> : delayedProjects.length.toString()}
          description="-1 desde ontem" // This would need actual data to be dynamic
          icon={AlertTriangle}
          iconColorClass="text-orange-500"
        />
        <KPICard
          title="Relatórios Pendentes"
          value="0"
          description="+5 hoje"
          icon={FileText}
          iconColorClass="text-purple-500"
        />
        <KPICard
          title="Tarefas Agendadas"
          value="0"
          description="esta semana"
          icon={CalendarDays}
          iconColorClass="text-green-500"
        />
        <KPICard
          title="Aprovações Pendentes"
          value="0"
          description="requer ação"
          icon={CheckSquare}
          iconColorClass="text-red-500"
        />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Obras Ativas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                Obras Ativas
              </CardTitle>
              <NavButton to="/projects" variant="outline" size="sm">
                Ver Todas
              </NavButton>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activeProjects.length > 0 ? (
                <div className="space-y-3">
                  {activeProjects.slice(0, 3).map(project => ( // Show up to 3 active projects
                    <div key={project.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex flex-col">
                        <span className="font-medium">{project.nome}</span>
                        <span className="text-sm text-muted-foreground">Progresso: {project.progresso}%</span>
                      </div>
                      <NavButton to={`/projects`} onClick={() => navigate(`/projects?selected=${project.id}`)} variant="outline" size="sm">
                        Ver Detalhes
                      </NavButton>
                    </div>
                  ))}
                  {activeProjects.length > 3 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      E mais {activeProjects.length - 3} obras ativas.
                    </p>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={HardHat}
                  title="Nenhuma obra ativa encontrada"
                  description="Comece um novo projeto para ver o seu progresso aqui."
                  buttonText="Nova Obra"
                  onButtonClick={() => navigate("/projects")}
                />
              )}
            </CardContent>
          </Card>

          {/* Relatórios Recentes (Placeholder) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                Relatórios Recentes
              </CardTitle>
              <NavButton to="/reports" variant="outline" size="sm">
                Ver Todos
              </NavButton>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={FileText}
                title="Nenhum relatório recente"
                description="Os relatórios gerados recentemente aparecerão aqui."
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <NavButton to="/projects" className="h-20 flex flex-col items-center justify-center text-center">
                  <HardHat className="h-5 w-5 mb-1" />
                  <span className="text-sm">Nova Obra</span>
                </NavButton>
                <NavButton to="/collaborators" variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                  <Users className="h-5 w-5 mb-1" />
                  <span className="text-sm">Gerir Utilizadores</span>
                </NavButton>
                <NavButton to="/budgeting" variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                  <Calculator className="h-5 w-5 mb-1" />
                  <span className="text-sm">Gerar Orçamento</span>
                </NavButton>
                <NavButton to="/reports" variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                  <FileText className="h-5 w-5 mb-1" />
                  <span className="text-sm">Relatórios</span>
                </NavButton>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-center" disabled>
                  <Upload className="h-5 w-5 mb-1" />
                  <span className="text-sm">Importar Dados</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-center" disabled>
                  <Settings className="h-5 w-5 mb-1" />
                  <span className="text-sm">Gestão da Empresa</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Notificações
              </CardTitle>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Bell}
                title="Não há notificações"
                description="As suas notificações aparecerão aqui."
              />
            </CardContent>
          </Card>

          {/* Agenda & Tarefas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" /> Agenda & Tarefas
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={CalendarDays}
                title="Nenhuma tarefa agendada"
                description="Adicione tarefas para acompanhar o progresso."
                buttonText="Adicionar tarefa"
                onButtonClick={() => console.log("Adicionar tarefa")}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;