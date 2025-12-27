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
import { Profile } from "@/schemas/profile-schema"; // Import Profile schema

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);
  const [profileData, setProfileData] = React.useState<Profile | null>(null); // NEW: State for profile data
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(true);
  const [pendingReportsCount, setPendingReportsCount] = React.useState(0); // NEW: State for pending reports
  const [isLoadingPendingReports, setIsLoadingPendingReports] = React.useState(true); // NEW: Loading state
  const [scheduledTasksCount, setScheduledTasksCount] = React.useState(0); // NEW: State for scheduled tasks
  const [isLoadingScheduledTasks, setIsLoadingScheduledTasks] = React.useState(true); // NEW: Loading state
  const [pendingApprovalsCount, setPendingApprovalsCount] = React.useState(0); // NEW: State for pending approvals
  const [isLoadingPendingApprovals, setIsLoadingPendingApprovals] = React.useState(true); // NEW: Loading state

  // Fetch user's company ID and profile data
  const fetchUserProfileAndCompanyId = React.useCallback(async () => {
    if (!user) {
      setUserCompanyId(null);
      setProfileData(null);
      return;
    }
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, first_name, last_name, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Erro ao carregar company_id e perfil:", profileError);
      setUserCompanyId(null);
      setProfileData(null);
    } else if (profile) {
      setUserCompanyId(profile.company_id);
      setProfileData(profile);
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

  // NEW: Fetch pending Livros de Obra (reports)
  const fetchPendingReports = React.useCallback(async () => {
    if (!userCompanyId) {
      setPendingReportsCount(0);
      setIsLoadingPendingReports(false);
      return;
    }
    setIsLoadingPendingReports(true);
    const { count, error } = await supabase
      .from('livros_obra')
      .select('id', { count: 'exact' })
      .eq('company_id', userCompanyId)
      .eq('estado', 'em_preparacao'); // Assuming 'em_preparacao' means pending

    if (error) {
      console.error("Erro ao carregar relatórios pendentes:", error);
      setPendingReportsCount(0);
    } else {
      setPendingReportsCount(count || 0);
    }
    setIsLoadingPendingReports(false);
  }, [userCompanyId]);

  // NEW: Fetch scheduled tasks
  const fetchScheduledTasks = React.useCallback(async () => {
    if (!userCompanyId) {
      setScheduledTasksCount(0);
      setIsLoadingScheduledTasks(false);
      return;
    }
    setIsLoadingScheduledTasks(true);
    // Fetch tasks that are 'Planeado' or 'Em execução'
    const { count, error } = await supabase
      .from('schedule_tasks')
      .select('id', { count: 'exact' })
      .eq('company_id', userCompanyId)
      .in('estado', ['Planeado', 'Em execução']);

    if (error) {
      console.error("Erro ao carregar tarefas agendadas:", error);
      setScheduledTasksCount(0);
    } else {
      setScheduledTasksCount(count || 0);
    }
    setIsLoadingScheduledTasks(false);
  }, [userCompanyId]);

  // NEW: Fetch pending approvals
  const fetchPendingApprovals = React.useCallback(async () => {
    if (!userCompanyId) {
      setPendingApprovalsCount(0);
      setIsLoadingPendingApprovals(false);
      return;
    }
    setIsLoadingPendingApprovals(true);
    const { count, error } = await supabase
      .from('approvals')
      .select('id', { count: 'exact' })
      .eq('company_id', userCompanyId)
      .eq('status', 'pending');

    if (error) {
      console.error("Erro ao carregar aprovações pendentes:", error);
      setPendingApprovalsCount(0);
    } else {
      setPendingApprovalsCount(count || 0);
    }
    setIsLoadingPendingApprovals(false);
  }, [userCompanyId]);


  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchUserProfileAndCompanyId();
    }
  }, [isSessionLoading, fetchUserProfileAndCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchProjects();
      fetchPendingReports(); // NEW: Call new fetch functions
      fetchScheduledTasks(); // NEW: Call new fetch functions
      fetchPendingApprovals(); // NEW: Call new fetch functions
    }
  }, [userCompanyId, fetchProjects, fetchPendingReports, fetchScheduledTasks, fetchPendingApprovals]);

  // Modificado para incluir 'Planeada' como obra ativa
  const activeProjects = projects.filter(p => p.estado === "Em execução" || p.estado === "Planeada");
  const delayedProjects = projects.filter(p => p.estado === "Atrasada");

  const userName = profileData?.first_name && profileData?.last_name
    ? `${profileData.first_name} ${profileData.last_name}`
    : user?.email || 'Utilizador';
  const userRole = profileData?.role || 'Cliente';

  return (
    <div className="space-y-6">
      {/* Header - now specific to Dashboard content */}
      <div className="flex flex-col md:flex-row items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            Bem-vindo, {userName}
          </h1>
          <p className="text-muted-foreground text-sm capitalize">{userRole}</p>
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
          value={isLoadingPendingReports ? <Loader2 className="h-5 w-5 animate-spin" /> : pendingReportsCount.toString()}
          description="requerem atenção"
          icon={FileText}
          iconColorClass="text-purple-500"
        />
        <KPICard
          title="Tarefas Agendadas"
          value={isLoadingScheduledTasks ? <Loader2 className="h-5 w-5 animate-spin" /> : scheduledTasksCount.toString()}
          description="esta semana"
          icon={CalendarDays}
          iconColorClass="text-green-500"
        />
        <KPICard
          title="Aprovações Pendentes"
          value={isLoadingPendingApprovals ? <Loader2 className="h-5 w-5 animate-spin" /> : pendingApprovalsCount.toString()}
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