"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { CheckSquare, Clock, AlertTriangle, User, CalendarDays, FileText, DollarSign, HardHat } from "lucide-react";
import { ApprovalWithRelations } from "@/schemas/approval-schema";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface ApprovalsDashboardProps {
  approvals: ApprovalWithRelations[];
  onSelectApproval: (approval: ApprovalWithRelations) => void;
  isLoading: boolean;
}

const ApprovalsDashboard: React.FC<ApprovalsDashboardProps> = ({ approvals, onSelectApproval, isLoading }) => {
  const getStatusBadge = (status: ApprovalWithRelations['status']) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
    let colorClass = "";
    let icon = null;

    switch (status) {
      case "pending":
        variant = "outline";
        colorClass = "border-orange-500 text-orange-600 dark:text-orange-400";
        icon = <Clock className="h-3 w-3 mr-1" />;
        break;
      case "approved":
        variant = "default";
        colorClass = "bg-green-500 hover:bg-green-600 text-white";
        icon = <CheckSquare className="h-3 w-3 mr-1" />;
        break;
      case "rejected":
        variant = "destructive";
        colorClass = "bg-red-500 hover:bg-red-600 text-white";
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
        break;
      case "changes_requested":
        variant = "default";
        colorClass = "bg-blue-500 hover:bg-blue-600 text-white";
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
        break;
    }
    return <Badge className={cn("w-fit", colorClass)} variant={variant}>{icon} {status.replace('_', ' ')}</Badge>;
  };

  const getEntityTypeIcon = (entityType: ApprovalWithRelations['entity_type']) => {
    switch (entityType) {
      case 'budget': return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'budget_item': return <DollarSign className="h-4 w-4 text-blue-500" />;
      case 'rdo_entry': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'schedule_task': return <CalendarDays className="h-4 w-4 text-green-500" />;
      case 'budget_revision': return <DollarSign className="h-4 w-4 text-orange-500" />;
      default: return <CheckSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEntityTypeLabel = (entityType: ApprovalWithRelations['entity_type']) => {
    switch (entityType) {
      case 'budget': return "Orçamento";
      case 'budget_item': return "Item de Orçamento";
      case 'rdo_entry': return "Registo RDO";
      case 'schedule_task': return "Tarefa de Cronograma";
      case 'budget_revision': return "Revisão de Orçamento";
      default: return "Aprovação Genérica";
    }
  };

  const getUserInitials = (user: { first_name: string | null; last_name: string | null; } | null) => {
    if (!user) return "??";
    return `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-1" />
            <Skeleton className="h-4 w-full mb-2" />
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="Nenhuma aprovação pendente"
        description="Todas as aprovações estão em dia. Ótimo trabalho!"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {approvals.map((approval) => (
        <Card
          key={approval.id}
          className={cn(
            "cursor-pointer hover:shadow-md transition-shadow duration-200 ease-in-out",
            approval.status === 'pending' && "border-orange-300 dark:border-orange-700",
            approval.status === 'rejected' && "border-red-300 dark:border-red-700",
          )}
          onClick={() => onSelectApproval(approval)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              {getEntityTypeIcon(approval.entity_type)}
              <CardTitle className="text-lg font-semibold">{getEntityTypeLabel(approval.entity_type)}</CardTitle>
            </div>
            {getStatusBadge(approval.status)}
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-1">
              Obra: <span className="font-medium">{approval.projects?.nome || "N/A"}</span>
            </p>
            <p className="text-sm text-foreground mb-2">{approval.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={approval.requested_by_user?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{getUserInitials(approval.requested_by_user)}</AvatarFallback>
              </Avatar>
              <span>Solicitado por: {approval.requested_by_user?.first_name} {approval.requested_by_user?.last_name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Em: {approval.requested_at ? format(parseISO(approval.requested_at), "dd/MM/yyyy HH:mm", { locale: pt }) : "N/A"}
            </p>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              Ver Detalhes
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ApprovalsDashboard;