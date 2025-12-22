"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/EmptyState";
import { CalendarDays, User, DollarSign, HardHat, ClipboardList, Info, FileText, CheckCircle, Play, AlertTriangle } from "lucide-react";
import { RdoEntry } from "@/schemas/compliance-schema";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns"; // Adicionado: Importação da função format

interface RdoTimelineProps {
  rdos: RdoEntry[];
  projectUsers: { id: string; first_name: string; last_name: string; avatar_url: string | null; }[];
}

const RdoTimeline: React.FC<RdoTimelineProps> = ({ rdos, projectUsers }) => {
  if (rdos.length === 0) {
    return (
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Registos Diários de Obra (RDOs)</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={CalendarDays}
            title="Nenhum RDO encontrado para este período"
            description="Os RDOs serão automaticamente gerados com base nas atualizações da obra ou podem ser adicionados manualmente."
          />
        </CardContent>
      </Card>
    );
  }

  // Group RDOs by date
  const groupedRdos = rdos.reduce((acc, rdo) => {
    const date = formatDate(rdo.date);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(rdo);
    return acc;
  }, {} as Record<string, RdoEntry[]>);

  const sortedDates = Object.keys(groupedRdos).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getUserInitials = (user: { first_name: string; last_name: string; } | null) => {
    if (!user) return "??";
    return `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'manual_entry': return <FileText className="h-4 w-4 text-gray-500" />;
      case 'budget_approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'budget_item_update': return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'task_progress_update': return <Play className="h-4 w-4 text-purple-500" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventTypeText = (eventType: string) => {
    switch (eventType) {
      case 'manual_entry': return "Registo Manual";
      case 'budget_approved': return "Orçamento Aprovado";
      case 'budget_item_update': return "Atualização de Serviço";
      case 'task_progress_update': return "Atualização de Fase";
      default: return "Evento Desconhecido";
    }
  };

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Registos Diários de Obra (RDOs)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-8">
          {/* Vertical line for timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {sortedDates.map((date, dateIndex) => (
            <div key={date} className="mb-8 last:mb-0">
              <div className="relative flex items-center mb-4">
                <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white -translate-x-1/2">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <h3 className="ml-8 text-lg font-semibold">{date}</h3>
              </div>
              <div className="ml-8 space-y-4">
                {groupedRdos[date].map((rdo) => {
                  const responsibleUser = projectUsers.find(u => u.id === rdo.responsible_user_id);
                  return (
                    <div key={rdo.id} className="relative p-4 border rounded-md bg-muted/20">
                      <div className="absolute left-[-36px] top-4 flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border">
                        {getEventTypeIcon(rdo.event_type)}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "font-medium text-sm",
                          rdo.event_type === 'manual_entry' && "text-gray-700 dark:text-gray-300",
                          rdo.event_type === 'budget_approved' && "text-green-600 dark:text-green-400",
                          rdo.event_type === 'budget_item_update' && "text-blue-600 dark:text-blue-400",
                          rdo.event_type === 'task_progress_update' && "text-purple-600 dark:text-purple-400",
                        )}>
                          {getEventTypeText(rdo.event_type)}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {responsibleUser && (
                            <>
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={responsibleUser.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">{getUserInitials(responsibleUser)}</AvatarFallback>
                              </Avatar>
                              <span>{responsibleUser.first_name} {responsibleUser.last_name}</span>
                            </>
                          )}
                          <span>{format(new Date(rdo.created_at || rdo.date), "HH:mm")}</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground mb-2">{rdo.description}</p>
                      {rdo.observations && (
                        <p className="text-xs text-muted-foreground italic">Obs: {rdo.observations}</p>
                      )}
                      {rdo.details && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          {rdo.event_type === 'budget_item_update' && (
                            <>
                              <p>Serviço: {rdo.details.service_name}</p>
                              <p>Qtd. Anterior: {rdo.details.old_quantity} | Qtd. Nova: {rdo.details.new_quantity}</p>
                              <p>Custo Exec. Anterior: {formatCurrency(rdo.details.old_executed_cost)} | Custo Exec. Novo: {formatCurrency(rdo.details.new_executed_cost)}</p>
                              <p>Estado Anterior: {rdo.details.old_state} | Estado Novo: {rdo.details.new_state}</p>
                            </>
                          )}
                          {rdo.event_type === 'task_progress_update' && (
                            <>
                              <p>Fase: {rdo.details.task_name}</p>
                              <p>Progresso Anterior: {rdo.details.old_progress}% | Progresso Novo: {rdo.details.new_progress}%</p>
                              <p>Estado Anterior: {rdo.details.old_state} | Estado Novo: {rdo.details.new_state}</p>
                            </>
                          )}
                          {rdo.event_type === 'budget_approved' && (
                            <>
                              <p>Orçamento: {rdo.details.budget_name}</p>
                              <p>Total Planeado: {formatCurrency(rdo.details.total_planeado)}</p>
                            </>
                          )}
                        </div>
                      )}
                      {rdo.attachments_url && rdo.attachments_url.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-muted-foreground">Anexos: </span>
                          {rdo.attachments_url.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mr-2">
                              Anexo {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RdoTimeline;