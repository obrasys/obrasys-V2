"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  XCircle,
  MessageSquareMore,
  Download,
  Loader2,
  CalendarDays,
  Info,
} from "lucide-react";
import {
  ApprovalWithRelations,
  ApprovalHistoryWithUser,
} from "@/schemas/approval-schema";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "@/components/SessionContextProvider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BudgetDB,
  BudgetItemDB,
} from "@/schemas/budget-schema";
import { RdoEntry } from "@/schemas/compliance-schema";
import { formatCurrency } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";

/* =========================
   SAFETY HELPERS
========================= */

const isSafeHttpUrl = (rawUrl: string): boolean => {
  try {
    const u = new URL(rawUrl);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const getSafeLinkLabel = (rawUrl: string, fallback: string): string => {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname === "/" ? "" : u.pathname;
    const label = `${host}${path}`;
    return label.length > 60 ? `${label.slice(0, 57)}...` : label;
  } catch {
    return fallback;
  }
};

/* =========================
   PROPS
========================= */

interface ApprovalDetailViewProps {
  approval: ApprovalWithRelations;
  onApprovalAction: () => void;
  setIsProcessingApproval: (v: boolean) => void;
  isProcessingApproval: boolean;
}

/* =========================
   COMPONENT
========================= */

const ApprovalDetailView: React.FC<ApprovalDetailViewProps> = ({
  approval,
  onApprovalAction,
  setIsProcessingApproval,
  isProcessingApproval,
}) => {
  const { user } = useSession();

  const [approvalHistory, setApprovalHistory] =
    React.useState<ApprovalHistoryWithUser[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] =
    React.useState(true);

  const [relatedEntityData, setRelatedEntityData] =
    React.useState<any>(null);
  const [isLoadingEntityData, setIsLoadingEntityData] =
    React.useState(true);

  const [isCommentDialogOpen, setIsCommentDialogOpen] =
    React.useState(false);
  const [commentActionType, setCommentActionType] =
    React.useState<"rejected" | "changes_requested" | null>(null);
  const [commentText, setCommentText] =
    React.useState("");

  /* =========================
     DATA FETCHING
  ========================= */

  const fetchApprovalHistory = React.useCallback(async () => {
    setIsLoadingHistory(true);

    const { data, error } = await supabase
      .from("approval_history")
      .select(
        "id, approval_id, action_type, action_by_user_id, action_at, comments, old_status, new_status"
      )
      .eq("approval_id", approval.id!)
      .order("action_at", { ascending: true });

    if (error) {
      console.error("[ApprovalDetailView] history", error);
      toast.error("Erro ao carregar histórico da aprovação");
      setApprovalHistory([]);
      setIsLoadingHistory(false);
      return;
    }

    const userIds = Array.from(
      new Set(data?.map((i) => i.action_by_user_id).filter(Boolean))
    );

    let usersMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: users, error: usersError } =
        await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", userIds);

      if (usersError) {
        console.error("[ApprovalDetailView] users", usersError);
      } else {
        users?.forEach((u) => usersMap.set(u.id, u));
      }
    }

    setApprovalHistory(
      (data || []).map((item) => ({
        ...item,
        action_by_user: item.action_by_user_id
          ? usersMap.get(item.action_by_user_id)
          : null,
      }))
    );

    setIsLoadingHistory(false);
  }, [approval.id]);

  const fetchRelatedEntityData = React.useCallback(async () => {
    setIsLoadingEntityData(true);

    let data: any = null;
    let error: any = null;

    switch (approval.entity_type) {
      case "budget":
      case "budget_revision":
        ({ data, error } = await supabase
          .from("budgets")
          .select("*")
          .eq("id", approval.entity_id)
          .maybeSingle());
        break;

      case "budget_item":
        ({ data, error } = await supabase
          .from("budget_items")
          .select("*")
          .eq("id", approval.entity_id)
          .maybeSingle());
        break;

      case "rdo_entry":
        ({ data, error } = await supabase
          .from("rdo_entries")
          .select("*")
          .eq("id", approval.entity_id)
          .maybeSingle());
        break;

      default:
        console.warn(
          "[ApprovalDetailView] entidade desconhecida",
          approval.entity_type
        );
    }

    if (error) {
      console.error("[ApprovalDetailView] entity", error);
      toast.error("Erro ao carregar dados relacionados");
      setRelatedEntityData(null);
    } else {
      setRelatedEntityData(data);
    }

    setIsLoadingEntityData(false);
  }, [approval.entity_type, approval.entity_id]);

  React.useEffect(() => {
    fetchApprovalHistory();
    fetchRelatedEntityData();
  }, [fetchApprovalHistory, fetchRelatedEntityData]);

  /* =========================
     ACTIONS
  ========================= */

  const handleApprovalAction = async (
    newStatus: ApprovalWithRelations["status"],
    comments: string | null = null
  ) => {
    if (!user || !approval.id) {
      toast.error("Utilizador não autenticado");
      return;
    }

    setIsProcessingApproval(true);

    const { error: updateError } = await supabase
      .from("approvals")
      .update({
        status: newStatus,
        decision_at: new Date().toISOString(),
        decision_by_user_id: user.id,
        comments,
        updated_at: new Date().toISOString(),
      })
      .eq("id", approval.id);

    if (updateError) {
      console.error("[ApprovalDetailView] update", updateError);
      toast.error("Erro ao atualizar aprovação");
      setIsProcessingApproval(false);
      return;
    }

    const { error: historyError } = await supabase
      .from("approval_history")
      .insert({
        approval_id: approval.id,
        action_type: newStatus,
        action_by_user_id: user.id,
        comments,
        old_status: approval.status,
        new_status: newStatus,
      });

    if (historyError) {
      console.error("[ApprovalDetailView] history insert", historyError);
      toast.error("Erro ao registar histórico");
      setIsProcessingApproval(false);
      return;
    }

    toast.success("Aprovação atualizada com sucesso");
    onApprovalAction();
    fetchApprovalHistory();

    setIsProcessingApproval(false);
    setIsCommentDialogOpen(false);
    setCommentText("");
    setCommentActionType(null);
  };

  /* =========================
     RENDER
  ========================= */

  if (isLoadingEntityData) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Aprovação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Estado:</strong>{" "}
            {approval.status.replace("_", " ")}
          </div>

          <Separator />

          <h3 className="font-semibold">Histórico</h3>

          {isLoadingHistory ? (
            <Skeleton className="h-24 w-full" />
          ) : approvalHistory.length === 0 ? (
            <p className="text-muted-foreground">
              Sem histórico
            </p>
          ) : (
            approvalHistory.map((h) => (
              <div key={h.id} className="border rounded p-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={h.action_by_user?.avatar_url || undefined}
                    />
                    <AvatarFallback>
                      {h.action_by_user?.first_name?.[0] ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium capitalize">
                    {h.action_type.replace("_", " ")}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {h.action_at
                      ? format(
                          parseISO(h.action_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: pt }
                        )
                      : "N/A"}
                  </span>
                </div>
                {h.comments && (
                  <p className="text-sm mt-2">
                    "{h.comments}"
                  </p>
                )}
              </div>
            ))
          )}

          {approval.status === "pending" && (
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  handleApprovalAction("approved")
                }
                disabled={isProcessingApproval}
              >
                {isProcessingApproval ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckSquare className="h-4 w-4 mr-2" />
                )}
                Aprovar
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  setCommentActionType("rejected");
                  setIsCommentDialogOpen(true);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isCommentDialogOpen}
        onOpenChange={setIsCommentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Comentário obrigatório
            </DialogTitle>
            <DialogDescription>
              Justifique a decisão
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={commentText}
            onChange={(e) =>
              setCommentText(e.target.value)
            }
          />

          <DialogFooter>
            <Button
              onClick={() =>
                handleApprovalAction(
                  commentActionType!,
                  commentText
                )
              }
              disabled={!commentText.trim()}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalDetailView;