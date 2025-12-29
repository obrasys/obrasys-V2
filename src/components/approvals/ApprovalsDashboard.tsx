"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CalendarDays,
  FileText,
  DollarSign,
} from "lucide-react";
import { ApprovalWithRelations } from "@/schemas/approval-schema";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface ApprovalsDashboardProps {
  approvals: ApprovalWithRelations[];
  onSelectApproval: (approval: ApprovalWithRelations) => void;
  isLoading: boolean;
}

/* =======================
   CONSTANTES / MAPPERS
======================= */

const STATUS_LABELS: Record<
  ApprovalWithRelations["status"],
  string
> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  changes_requested: "Alterações Solicitadas",
};

const ENTITY_TYPE_LABELS: Record<
  ApprovalWithRelations["entity_type"],
  string
> = {
  budget: "Orçamento",
  budget_item: "Item de Orçamento",
  rdo_entry: "Registo RDO",
  schedule_task: "Tarefa de Cronograma",
  budget_revision: "Revisão de Orçamento",
};

const ENTITY_TYPE_ICONS: Record<
  ApprovalWithRelations["entity_type"],
  JSX.Element
> = {
  budget: <DollarSign className="h-4 w-4 text-blue-500" />,
  budget_item: <DollarSign className="h-4 w-4 text-blue-500" />,
  rdo_entry: <FileText className="h-4 w-4 text-purple-500" />,
  schedule_task: (
    <CalendarDays className="h-4 w-4 text-green-500" />
  ),
  budget_revision: (
    <DollarSign className="h-4 w-4 text-orange-500" />
  ),
};

const ApprovalsDashboard: React.FC<
  ApprovalsDashboardProps
> = ({ approvals, onSelectApproval, isLoading }) => {
  /* =======================
     HELPERS
  ======================= */

  const getStatusBadge = (
    status: ApprovalWithRelations["status"]
  ) => {
    let variant:
      | "default"
      | "secondary"
      | "destructive"
      | "outline" = "secondary";
    let colorClass = "";
    let icon: JSX.Element | null = null;

    switch (status) {
      case "pending":
        variant = "outline";
        colorClass =
          "border-orange-500 text-orange-600 dark:text-orange-400";
        icon = <Clock className="h-3 w-3 mr-1" />;
        break;

      case "approved":
        variant = "default";
        colorClass =
          "bg-green-500 hover:bg-green-600 text-white";
        icon = <CheckSquare className="h-3 w-3 mr-1" />;
        break;

      case "rejected":
        variant = "destructive";
        colorClass =
          "bg-red-500 hover:bg-red-600 text-white";
        icon = (
          <AlertTriangle className="h-3 w-3 mr-1" />
        );
        break;

      case "changes_requested":
        variant = "default";
        colorClass =
          "bg-blue-500 hover:bg-blue-600 text-white";
        icon = (
          <AlertTriangle className="h-3 w-3 mr-1" />
        );
        break;
    }

    return (
      <Badge
        variant={variant}
        className={cn("w-fit", colorClass)}
      >
        {icon}
        {STATUS_LABELS[status]}
      </Badge>
    );
  };

  const getUserInitials = (
    user:
      | {
          first_name: string | null;
          last_name: string | null;
        }
      | null
  ) => {
    if (!user) return "??";
    return `${user.first_name?.charAt(0) || ""}${
      user.last_name?.charAt(0) || ""
    }`.toUpperCase();
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "N/A";
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return "N/A";
    return format(parsed, "dd/MM/yyyy HH:mm", {
      locale: pt,
    });
  };

  /* =======================
     LOADING
  ======================= */

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

  /* =======================
     EMPTY STATE
  ======================= */

  if (approvals.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="Nenhuma aprovação pendente"
        description="Todas as aprovações estão em dia. Ótimo trabalho!"
      />
    );
  }

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {approvals.map((approval) => (
        <Card
          key={approval.id}
          className={cn(
            "transition-shadow hover:shadow-md",
            approval.status === "pending" &&
              "border-orange-300 dark:border-orange-700",
            approval.status === "rejected" &&
              "border-red-300 dark:border-red-700"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              {ENTITY_TYPE_ICONS[approval.entity_type]}
              <CardTitle className="text-lg font-semibold">
                {
                  ENTITY_TYPE_LABELS[
                    approval.entity_type
                  ]
                }
              </CardTitle>
            </div>
            {getStatusBadge(approval.status)}
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground mb-1">
              Obra:{" "}
              <span className="font-medium">
                {approval.projects?.nome || "N/A"}
              </span>
            </p>

            <p className="text-sm text-foreground mb-2">
              {approval.description}
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={
                    approval.requested_by_user?.avatar_url ||
                    undefined
                  }
                />
                <AvatarFallback className="text-xs">
                  {getUserInitials(
                    approval.requested_by_user
                  )}
                </AvatarFallback>
              </Avatar>
              <span>
                Solicitado por:{" "}
                {approval.requested_by_user?.first_name}{" "}
                {approval.requested_by_user?.last_name}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              Em: {formatDate(approval.requested_at)}
            </p>

            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => onSelectApproval(approval)}
            >
              Ver Detalhes
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ApprovalsDashboard;
