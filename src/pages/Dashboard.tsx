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
  DollarSign, // For financial alerts
  ReceiptText, // For overdue invoices
  Wallet, // For overdue expenses
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import NavButton from "@/components/NavButton";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // Import toast from sonner
import { Project } from "@/schemas/project-schema"; // Import Project schema
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading states
import { Profile } from "@/schemas/profile-schema"; // Import Profile schema
import { AiAlert } from "@/schemas/ai-alert-schema"; // Import AiAlert schema
import { Invoice, Expense } from "@/schemas/invoicing-schema"; // Import Invoice and Expense schemas
import { format, parseISO } from "date-fns"; // Import format and parseISO for date formatting
import { pt } from "date-fns/locale"; // Import pt locale for date formatting
import { formatCurrency } from "@/utils/formatters"; // Import formatCurrency
import { cn } from "@/lib/utils"; // Import cn for conditional classNames
import NotificationToastContent from "@/components/NotificationToastContent"; // NEW: Import the new component

interface DashboardNotification {
  id: string;
  type: 'project_delay' | 'financial_alert' | 'overdue_invoice' | 'overdue_expense';
  title: string;
  message: string;
  date: string; // ISO string
  icon: React.ElementType;
  iconColorClass: string;
  link?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);
  const [profileData, setProfileData] = React.useState<Profile | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(true);
  const [pendingReportsCount, setPendingReportsCount] = React.useState(0);
  const [isLoadingPendingReports, setIsLoadingPendingReports] = React.useState(true);
  const [scheduledTasksCount, setScheduledTasksCount] = React.useState(0);
  const [isLoadingScheduledTasks, setIsLoadingScheduledTasks] = React.useState(true);
  const [pendingApprovalsCount, setPendingApprovalsCount] = React.useState(0);
  const [isLoadingPendingApprovals, setIsLoadingPendingApprovals] = React.useState(true);
  const [notifications, setNotifications] = React.useState<DashboardNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = React.useState(true);

  // NEW: Set to keep track of displayed notification IDs to avoid duplicate toasts
  const displayedNotificationIds = React.useRef(new Set<string>());

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

  // Fetch pending Livros de Obra (reports)
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
      .eq('estado', 'em_preparacao');

    if (error) {
      console.error("Erro ao carregar relatórios pendentes:", error);
      setPendingReportsCount(0);
    } else {
      setPendingReportsCount(count || 0);
    }
    setIsLoadingPendingReports(false);
  }, [userCompanyId]);

  // Fetch scheduled tasks
  const fetchScheduledTasks = React.useCallback(async () => {
    if (!userCompanyId) {
      setScheduledTasksCount(0);
      setIsLoadingScheduledTasks(false);
      return;
    }
    setIsLoadingScheduledTasks(true);
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

  // Fetch pending approvals
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

  // Fetch all notifications (delays, financial alerts, overdue invoices/expenses)
  const fetchNotifications = React.useCallback(async () => {
    if (!userCompanyId) {
      setNotifications([]);
      setIsLoadingNotifications(false);
      return;
    }
    setIsLoadingNotifications(true);
    let fetchedNotifications: DashboardNotification[] = [];

    // 1. Project Delays (using already fetched projects)
    projects.filter(p => p.estado === "Atrasada").forEach(project => {
      fetchedNotifications.push({
        id: `project-delay-${project.id}`,
        type: 'project_delay',
        title: `Obra Atrasada: ${project.nome}`,
        message: `O projeto "${project.nome}" está marcado como atrasado.`,
        date: new Date().toISOString(), // Use current date for simplicity
        icon: AlertTriangle,
        iconColorClass: "text-orange-500",
        link: `/projects?selected=${project.id}`,
      });
    });

    // 2. AI Alerts (Cost Deviation, Margin Risk)
    const { data: aiAlerts, error: aiAlertsError } = await supabase
      .from('ai_alerts')
      .select('id, title, message, severity, created_at, projects(nome)')
      .eq('company_id', userCompanyId)
      .in('severity', ['critical', 'warning'])
      .in('type', ['Cost Deviation', 'Margin Risk'])
      .eq('resolved', false) // Only show unresolved alerts
      .order('created_at', { ascending: false });

    if (aiAlertsError) {
      console.error("Erro ao carregar alertas de IA:", aiAlertsError);
    } else {
      (aiAlerts || []).forEach((alert: any) => {
        fetchedNotifications.push({
          id: `ai-alert-${alert.id}`,
          type: 'financial_alert',
          title: alert.title,
          message: `${alert.message} (Projeto: ${alert.projects?.nome || 'N/A'})`,
          date: alert.created_at,
          icon: Bell,
          iconColorClass: alert.severity === 'critical' ? 'text-red-500' : 'text-orange-500',
          link: `/automation-intelligence/ai-alerts`, // Link to AI alerts page
        });
      });
    }

    // 3. Overdue Invoices
    const { data: overdueInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, due_date, projects(nome)')
      .eq('company_id', userCompanyId)
      .eq('status', 'overdue')
      .order('due_date', { ascending: true });

    if (invoicesError) {
      console.error("Erro ao carregar faturas atrasadas:", invoicesError);
    } else {
      (overdueInvoices || []).forEach((invoice: any) => {
        fetchedNotifications.push({
          id: `overdue-invoice-${invoice.id}`,
          type: 'overdue_invoice',
          title: `Fatura Atrasada: ${invoice.invoice_number}`,
          message: `A fatura Nº ${invoice.invoice_number} (${formatCurrency(invoice.total_amount)}) está atrasada desde ${format(parseISO(invoice.due_date), 'dd/MM/yyyy', { locale: pt })}. (Obra: ${invoice.projects?.nome || 'N/A'})`,
          date: invoice.due_date,
          icon: ReceiptText,
          iconColorClass: "text-red-500",
          link: `/accounts`, // Link to accounts page
        });
      });
    }

    // 4. Overdue Expenses
    const { data: overdueExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('id, description, amount, due_date')
      .eq('company_id', userCompanyId)
      .eq('status', 'overdue')
      .order('due_date', { ascending: true });

    if (expensesError) {
      console.error("Erro ao carregar despesas atrasadas:", expensesError);
    } else {
      (overdueExpenses || []).forEach((expense: any) => {
        fetchedNotifications.push({
          id: `overdue-expense-${expense.id}`,
          type: 'overdue_expense',
          title: `Despesa Atrasada: ${expense.description}`,
          message: `A despesa "${expense.description}" (${formatCurrency(expense.amount)}) está atrasada desde ${format(parseISO(expense.due_date), 'dd/MM/yyyy', { locale: pt })}.`,
          date: expense.due_date,
          icon: Wallet,
          iconColorClass: "text-red-500",
          link: `/accounts`, // Link to accounts page
        });
      });
    }

    // Sort all notifications by date (most recent first)
    fetchedNotifications.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

    setNotifications(fetchedNotifications);
    setIsLoadingNotifications(false);
  }, [userCompanyId, projects]);

  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchUserProfileAndCompanyId();
    }
  }, [isSessionLoading, fetchUserProfileAndCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchProjects();
      fetchPendingReports();
      fetchScheduledTasks();
      fetchPendingApprovals();
    }
  }, [userCompanyId, fetchProjects, fetchPendingReports, fetchScheduledTasks, fetchPendingApprovals]);

  React.useEffect(() => {
    if (userCompanyId && !isLoadingProjects) {
      fetchNotifications();
    }
  }, [userCompanyId, projects, isLoadingProjects, fetchNotifications]);

  // NEW: Effect to display notifications as toasts
  React.useEffect(() => {
    if (!isLoadingNotifications && notifications.length > 0) {
      notifications.forEach(notification => {
        if (!displayedNotificationIds.current.has(notification.id)) {
          toast.custom((t) => (
            <NotificationToastContent
              id={notification.id}
              title={notification.title}
              message={notification.message}
              date={notification.date}
              icon={notification.icon}
              iconColorClass={notification.iconColorClass}
              link={notification.link}
              dismiss={() => toast.dismiss(t)}
            />
          ), {
            id: notification.id, // Use notification ID for sonner to manage
            duration: 10000, // Keep toast visible for 10 seconds
          });
          displayedNotificationIds.current.add(notification.id);
        }
      });
    }
  }, [notifications, isLoadingNotifications]);


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
          <Card className={cn(
            "bg-card text-card-foreground border border-border",
            notifications.length > 0 && "bg-highlight/50" // Apply highlight background when notifications exist
          )}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Notificações
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={fetchNotifications} disabled={isLoadingNotifications}>
                {isLoadingNotifications ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingNotifications ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map(notification => (
                    <Link key={notification.id} to={notification.link || "#"} className="block">
                      <div className="flex items-start p-3 border rounded-md hover:bg-muted/50 transition-colors">
                        <notification.icon className={`h-5 w-5 mr-3 mt-1 flex-shrink-0 ${notification.iconColorClass}`} />
                        <div>
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(notification.date), "dd/MM/yyyy HH:mm", { locale: pt })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Bell}
                  title="Não há notificações"
                  description="As suas notificações aparecerão aqui."
                />
              )}
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