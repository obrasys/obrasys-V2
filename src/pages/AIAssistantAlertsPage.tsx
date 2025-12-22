"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { BellRing, Loader2, CheckCircle, AlertTriangle, Info, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "@/components/SessionContextProvider";
import { AiAlert } from "@/schemas/ai-alert-schema";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

const AIAssistantAlertsPage = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AiAlert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [isUpdatingAlert, setIsUpdatingAlert] = useState(false);

  // Fetch user's company ID
  const fetchUserCompanyId = useCallback(async () => {
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

  // Fetch alerts for the current company
  const fetchAlerts = useCallback(async () => {
    if (!userCompanyId) {
      setAlerts([]);
      setIsLoadingAlerts(false);
      return;
    }
    setIsLoadingAlerts(true);
    const { data, error } = await supabase
      .from('ai_alerts')
      .select(`
        *,
        projects(nome)
      `)
      .eq('company_id', userCompanyId) // RLS should handle this, but explicit filter is good
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Erro ao carregar alertas: ${error.message}`);
      console.error("Erro ao carregar alertas:", error);
      setAlerts([]);
    } else {
      const formattedAlerts: AiAlert[] = (data || []).map((alert: any) => ({
        ...alert,
        project_name: alert.projects?.nome || "Projeto Desconhecido",
      }));
      setAlerts(formattedAlerts);
    }
    setIsLoadingAlerts(false);
  }, [userCompanyId]);

  useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
  }, [isSessionLoading, fetchUserCompanyId]);

  useEffect(() => {
    if (userCompanyId) {
      fetchAlerts();
    }
  }, [userCompanyId, fetchAlerts]);

  const handleToggleResolved = async (alertId: string, currentResolvedStatus: boolean) => {
    setIsUpdatingAlert(true);
    try {
      const { error } = await supabase
        .from('ai_alerts')
        .update({ resolved: !currentResolvedStatus, updated_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      toast.success(`Alerta ${!currentResolvedStatus ? "resolvido" : "reaberto"} com sucesso!`);
      fetchAlerts(); // Refresh alerts
    } catch (error: any) {
      toast.error(`Erro ao atualizar alerta: ${error.message}`);
      console.error("Erro ao atualizar alerta:", error);
    } finally {
      setIsUpdatingAlert(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!window.confirm("Tem certeza que deseja eliminar este alerta?")) return;
    setIsUpdatingAlert(true);
    try {
      const { error } = await supabase
        .from('ai_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      toast.success("Alerta eliminado com sucesso!");
      fetchAlerts(); // Refresh alerts
    } catch (error: any) {
      toast.error(`Erro ao eliminar alerta: ${error.message}`);
      console.error("Erro ao eliminar alerta:", error);
    } finally {
      setIsUpdatingAlert(false);
    }
  };

  const getSeverityIcon = (severity: AiAlert['severity']) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <BellRing className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColorClass = (severity: AiAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-orange-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoadingAlerts) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
          <Skeleton className="h-10 w-40 mt-2 md:mt-0" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Alertas de IA
        </h1>
        <Button onClick={fetchAlerts} disabled={isLoadingAlerts || isUpdatingAlert} className="flex items-center gap-2">
          {isLoadingAlerts ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar Alertas
        </Button>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Visualize todos os alertas gerados pelo assistente de IA para os seus projetos.
        </p>
      </section>

      {alerts.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="Nenhum alerta de IA encontrado"
          description="Os alertas de IA aparecerão aqui após a análise dos seus projetos. Tente analisar um Livro de Obra para gerar alertas."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className={cn(
              "relative hover:shadow-md transition-shadow duration-200 ease-in-out",
              alert.resolved && "opacity-70 border-dashed"
            )}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(alert.severity)}
                  <CardTitle className={cn("text-lg font-semibold", getSeverityColorClass(alert.severity))}>
                    {alert.title}
                  </CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdatingAlert}>
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleToggleResolved(alert.id!, alert.resolved || false)} disabled={isUpdatingAlert}>
                      {alert.resolved ? (
                        <>
                          <AlertTriangle className="mr-2 h-4 w-4" /> Reabrir Alerta
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Resolvido
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDeleteAlert(alert.id!)} className="text-red-600" disabled={isUpdatingAlert}>
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar Alerta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground">
                  Projeto: <span className="font-medium">{alert.project_name || "N/A"}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Gerado em: {alert.created_at ? format(parseISO(alert.created_at), "dd/MM/yyyy HH:mm", { locale: pt }) : "N/A"}
                </p>
                {alert.resolved && (
                  <div className="flex items-center text-sm text-green-600 font-medium mt-2">
                    <CheckCircle className="h-4 w-4 mr-1" /> Resolvido
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIAssistantAlertsPage;