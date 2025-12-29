"use client";

import React from "react";
import KPICard from "@/components/KPICard";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Loader2,
  DollarSign,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import NavButton from "@/components/NavButton";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Project } from "@/schemas/project-schema";
import { Profile } from "@/schemas/profile-schema";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import NotificationToastContent from "@/components/NotificationToastContent";
import { useNotification } from "@/contexts/NotificationContext";
import TrialBanner from "@/components/TrialBanner";

/** 🔥 NOVO */
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

interface DashboardNotification {
  id: string;
  type:
    | "project_delay"
    | "financial_alert"
    | "overdue_invoice"
    | "overdue_expense";
  title: string;
  message: string;
  date: string;
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
  const [isLoadingPendingReports, setIsLoadingPendingReports] =
    React.useState(true);

  const [scheduledTasksCount, setScheduledTasksCount] = React.useState(0);
  const [isLoadingScheduledTasks, setIsLoadingScheduledTasks] =
    React.useState(true);

  const [pendingApprovalsCount, setPendingApprovalsCount] = React.useState(0);
  const [isLoadingPendingApprovals, setIsLoadingPendingApprovals] =
    React.useState(true);

  const [notifications, setNotifications] = React.useState<
    DashboardNotification[]
  >([]);
  const [isLoadingNotifications, setIsLoadingNotifications] =
    React.useState(true);

  const displayedNotificationIds = React.useRef(new Set<string>());
  const { setNotificationState } = useNotification();

  /** 🔥 NOVO: estado real da assinatura via VIEW */
  const {
    data: subscriptionStatus,
    loading: isLoadingSubscription,
  } = useSubscriptionStatus(userCompanyId ?? undefined);

  const isSubscriptionBlocked =
    subscriptionStatus?.computed_status !== "active";

  /** ======================================================
   * PERFIL / COMPANY
   * ====================================================== */
  const fetchUserProfileAndCompanyId = React.useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("company_id, first_name, last_name, role")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setUserCompanyId(data.company_id);
      setProfileData(data);
    }
  }, [user]);

  /** ======================================================
   * PROJECTS
   * ====================================================== */
  const fetchProjects = React.useCallback(async () => {
    if (!userCompanyId) return;

    setIsLoadingProjects(true);
    const { data } = await supabase
      .from("projects")
      .select("id, nome, estado, progresso")
      .eq("company_id", userCompanyId);

    setProjects(data || []);
    setIsLoadingProjects(false);
  }, [userCompanyId]);

  /** ======================================================
   * COUNTERS
   * ====================================================== */
  const fetchCounters = React.useCallback(async () => {
    if (!userCompanyId) return;

    const [{ count: reports }, { count: tasks }, { count: approvals }] =
      await Promise.all([
        supabase
          .from("livros_obra")
          .select("id", { count: "exact" })
          .eq("company_id", userCompanyId)
          .eq("estado", "em_preparacao"),
        supabase
          .from("schedule_tasks")
          .select("id", { count: "exact" })
          .eq("company_id", userCompanyId)
          .in("estado", ["Planeado", "Em execução"]),
        supabase
          .from("approvals")
          .select("id", { count: "exact" })
          .eq("company_id", userCompanyId)
          .eq("status", "pending"),
      ]);

    setPendingReportsCount(reports || 0);
    setScheduledTasksCount(tasks || 0);
    setPendingApprovalsCount(approvals || 0);

    setIsLoadingPendingReports(false);
    setIsLoadingScheduledTasks(false);
    setIsLoadingPendingApprovals(false);
  }, [userCompanyId]);

  /** ======================================================
   * NOTIFICATIONS
   * ====================================================== */
  const fetchNotifications = React.useCallback(async () => {
    if (!userCompanyId) return;

    setIsLoadingNotifications(true);
    const list: DashboardNotification[] = [];

    projects
      .filter((p) => p.estado === "Atrasada")
      .forEach((p) =>
        list.push({
          id: `delay-${p.id}`,
          type: "project_delay",
          title: `Obra atrasada: ${p.nome}`,
          message: "Este projeto encontra-se atrasado.",
          date: new Date().toISOString(),
          icon: AlertTriangle,
          iconColorClass: "text-orange-500",
          link: `/projects?selected=${p.id}`,
        })
      );

    setNotifications(list);
    setIsLoadingNotifications(false);
  }, [userCompanyId, projects]);

  /** ======================================================
   * EFFECTS
   * ====================================================== */
  React.useEffect(() => {
    if (!isSessionLoading) fetchUserProfileAndCompanyId();
  }, [isSessionLoading, fetchUserProfileAndCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchProjects();
      fetchCounters();
    }
  }, [userCompanyId, fetchProjects, fetchCounters]);

  React.useEffect(() => {
    if (!isLoadingProjects) fetchNotifications();
  }, [isLoadingProjects, fetchNotifications]);

  React.useEffect(() => {
    notifications.forEach((n) => {
      if (!displayedNotificationIds.current.has(n.id)) {
        toast.custom(
          (t) => (
            <NotificationToastContent
              id={n.id}
              title={n.title}
              message={n.message}
              date={n.date}
              icon={n.icon}
              iconColorClass={n.iconColorClass}
              link={n.link}
              dismiss={() => toast.dismiss(t)}
            />
          ),
          { id: n.id }
        );
        displayedNotificationIds.current.add(n.id);
      }
    });
    setNotificationState(notifications.length, notifications.length > 0);
  }, [notifications, setNotificationState]);

  /** ======================================================
   * RENDER
   * ====================================================== */
  const activeProjects = projects.filter(
    (p) => p.estado === "Em execução" || p.estado === "Planeada"
  );
  const delayedProjects = projects.filter((p) => p.estado === "Atrasada");

  const userName =
    profileData?.first_name && profileData?.last_name
      ? `${profileData.first_name} ${profileData.last_name}`
      : user?.email;

  return (
    <div className="space-y-6">
      {/* 🔥 Banner correto baseado na VIEW */}
      {!isLoadingSubscription && subscriptionStatus && (
        <TrialBanner subscription={subscriptionStatus} />
      )}

      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Bem-vindo, {userName}</h1>
        {subscriptionStatus && (
          <p className="text-xs text-muted-foreground">
            Plano: {subscriptionStatus.subscription_plan} · Estado:{" "}
            {subscriptionStatus.computed_status}
          </p>
        )}
      </div>

      {/* KPI */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Obras Ativas"
          value={isLoadingProjects ? <Loader2 className="animate-spin" /> : activeProjects.length}
          icon={HardHat}
        />
        <KPICard
          title="Obras em Atraso"
          value={isLoadingProjects ? <Loader2 className="animate-spin" /> : delayedProjects.length}
          icon={AlertTriangle}
        />
        <KPICard
          title="Relatórios Pendentes"
          value={pendingReportsCount}
          icon={FileText}
        />
        <KPICard
          title="Tarefas"
          value={scheduledTasksCount}
          icon={CalendarDays}
        />
        <KPICard
          title="Aprovações"
          value={pendingApprovalsCount}
          icon={CheckSquare}
        />
      </section>

      {/* AÇÕES RÁPIDAS */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <NavButton to="/projects">Nova Obra</NavButton>
          <NavButton to="/budgeting" disabled={isSubscriptionBlocked}>
            Orçamento
          </NavButton>
          <NavButton to="/reports" disabled={isSubscriptionBlocked}>
            Relatórios
          </NavButton>
          <NavButton to="/plans" variant="outline">
            Nossos Planos
          </NavButton>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
