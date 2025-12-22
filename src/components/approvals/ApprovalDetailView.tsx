"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  CheckSquare,
  XCircle,
  MessageSquareMore,
  FileText,
  Download,
  Loader2,
  User,
  CalendarDays,
  Info,
  DollarSign,
  HardHat,
  ClipboardList,
} from "lucide-react";
import { ApprovalWithRelations, ApprovalHistoryWithUser } from "@/schemas/approval-schema";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Project } from "@/schemas/project-schema";
import { BudgetDB, BudgetItemDB, BudgetChapterDB } from "@/schemas/budget-schema";
import { RdoEntry } from "@/schemas/compliance-schema";
import { formatCurrency } from "@/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton"; // Added import for Skeleton

interface ApprovalDetailViewProps {
  approval: ApprovalWithRelations;
  onApprovalAction: () => void; // Callback to refresh approvals list
  setIsProcessingApproval: (isProcessing: boolean) => void;
  isProcessingApproval: boolean; // Added prop
}

const ApprovalDetailView: React.FC<ApprovalDetailViewProps> = ({
  approval,
  onApprovalAction,
  setIsProcessingApproval,
  isProcessingApproval, // Destructured prop
}) => {
  const { user } = useSession(); // Removed isLoading: isSessionLoading as it's not used directly here
  const [approvalHistory, setApprovalHistory] = React.useState<ApprovalHistoryWithUser[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  const [relatedEntityData, setRelatedEntityData] = React.useState<any>(null);
  const [isLoadingEntityData, setIsLoadingEntityData] = React.useState(true);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = React.useState(false);
  const [commentActionType, setCommentActionType] = React.useState<"rejected" | "changes_requested" | null>(null);
  const [commentText, setCommentText] = React.useState("");
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);

  const fetchApprovalHistory = React.useCallback(async () => {
    setIsLoadingHistory(true);
    const { data: historyData, error: historyError } = await supabase
      .from('approval_history')
      .select('id, approval_id, action_type, action_by_user_id, action_at, comments, old_status, new_status, created_at')
      .eq('approval_id', approval.id!)
      .order('action_at', { ascending: true });

    if (historyError) {
      toast.error(`Erro ao carregar histórico de aprovação: ${historyError.message}`);
      console.error("Erro ao carregar histórico de aprovação:", historyError);
      setApprovalHistory([]);
      setIsLoadingHistory(false);
      return;
    }

    const allUserIds = new Set<string>();
    historyData?.forEach(item => {
      if (item.action_by_user_id) allUserIds.add(item.action_by_user_id);
    });

    let usersMap = new Map<string, { first_name: string; last_name: string; avatar_url: string | null }>();
    if (allUserIds.size > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', Array.from(allUserIds));

      if (usersError) {
        console.error("Erro ao carregar perfis de utilizadores para histórico:", usersError);
        toast.error(`Erro ao carregar perfis de utilizadores para histórico: ${usersError.message}`);
      } else {
        usersData?.forEach(userProfile => {
          usersMap.set(userProfile.id, { first_name: userProfile.first_name, last_name: userProfile.last_name, avatar_url: userProfile.avatar_url });
        });
      }
    }

    const formattedHistory: ApprovalHistoryWithUser[] = (historyData || []).map((item: any) => ({
      ...item,
      action_by_user: item.action_by_user_id ? usersMap.get(item.action_by_user_id) : null,
    }));

    setApprovalHistory(formattedHistory);
    setIsLoadingHistory(false);
  }, [approval.id]);

  const fetchRelatedEntityData = React.useCallback(async () => {
    setIsLoadingEntityData(true);
    let data: any = null;
    let error: any = null;
    let userIdsToFetch = new Set<string>();

    switch (approval.entity_type) {
      case 'budget':
      case 'budget_revision':
        ({ data, error } = await supabase.from('budgets').select('*').eq('id', approval.entity_id).single());
        break;
      case 'budget_item':
        ({ data, error } = await supabase.from('budget_items').select('*').eq('id', approval.entity_id).single());
        break;
      case 'rdo_entry':
        // Fetch RDO entry and its responsible_user_id
        ({ data, error } = await supabase.from('rdo_entries').select('*, responsible_user_id').eq('id', approval.entity_id).single());
        if (data?.responsible_user_id) userIdsToFetch.add(data.responsible_user_id);
        break;
      case 'schedule_task':
        ({ data, error } = await supabase.from('schedule_tasks').select('*').eq('id', approval.entity_id).single());
        break;
      default:
        console.warn(`Tipo de entidade desconhecido: ${approval.entity_type}`);
    }

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      toast.error(`Erro ao carregar dados da entidade relacionada: ${error.message}`);
      console.error("Erro ao carregar entidade relacionada:", error);
      setRelatedEntityData(null);
    } else {
      // If RDO entry, fetch responsible user profile
      if (approval.entity_type === 'rdo_entry' && data && userIdsToFetch.size > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .in('id', Array.from(userIdsToFetch));

        if (usersError) {
          console.error("Erro ao carregar perfil do utilizador responsável pelo RDO:", usersError);
          toast.error(`Erro ao carregar perfil do utilizador responsável pelo RDO: ${usersError.message}`);
        } else if (usersData && usersData.length > 0) {
          data.responsible_user = usersData[0]; // Attach the user profile to the RDO data
        }
      }
      setRelatedEntityData(data);
    }
    setIsLoadingEntityData(false);
  }, [approval.entity_type, approval.entity_id]);

  React.useEffect(() => {
    fetchApprovalHistory();
    fetchRelatedEntityData();
  }, [fetchApprovalHistory, fetchRelatedEntityData]);

  const getUserInitials = (user: { first_name: string | null; last_name: string | null; } | null) => {
    if (!user) return "??";
    return `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
  };

  const handleApprovalAction = async (newStatus: ApprovalWithRelations['status'], comments: string | null = null) => {
    if (!user || !approval.id) {
      toast.error("Utilizador não autenticado ou ID da aprovação em falta.");
      return;
    }
    setIsProcessingApproval(true);

    try {
      // 1. Update the main approval record
      const { error: updateError } = await supabase
        .from('approvals')
        .update({
          status: newStatus,
          decision_at: new Date().toISOString(),
          decision_by_user_id: user.id,
          comments: comments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', approval.id);

      if (updateError) throw updateError;

      // 2. Add entry to approval history
      const { error: historyError } = await supabase
        .from('approval_history')
        .insert({
          approval_id: approval.id,
          action_type: newStatus,
          action_by_user_id: user.id,
          comments: comments,
          old_status: approval.status,
          new_status: newStatus,
        });

      if (historyError) throw historyError;

      toast.success(`Aprovação ${newStatus.replace('_', ' ')} com sucesso!`);
      onApprovalAction(); // Refresh parent list
      fetchApprovalHistory(); // Refresh local history
      // The parent component (ApprovalsPage) will re-fetch and update the selectedApproval state.
    } catch (error: any) {
      toast.error(`Erro ao processar aprovação: ${error.message}`);
      console.error("Erro ao processar aprovação:", error);
    } finally {
      setIsProcessingApproval(false);
      setIsCommentDialogOpen(false);
      setCommentText("");
      setCommentActionType(null);
    }
  };

  const openCommentDialog = (action: "rejected" | "changes_requested") => {
    setCommentActionType(action);
    setIsCommentDialogOpen(true);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast.error("O comentário é obrigatório para esta ação.");
      return;
    }
    if (commentActionType) {
      await handleApprovalAction(commentActionType, commentText);
    }
  };

  const isPending = approval.status === 'pending';
  const isDecisionMade = approval.status !== 'pending';

  const renderRelatedEntityDetails = () => {
    if (isLoadingEntityData) {
      return <Skeleton className="h-32 w-full" />;
    }
    if (!relatedEntityData) {
      return <p className="text-muted-foreground">Dados da entidade relacionada não encontrados.</p>;
    }

    switch (approval.entity_type) {
      case 'budget':
      case 'budget_revision':
        const budget = relatedEntityData as BudgetDB;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-semibold">Nome do Orçamento:</span> {budget.nome}</div>
            <div><span className="font-semibold">Localização:</span> {budget.localizacao || 'N/A'}</div>
            <div><span className="font-semibold">Tipo de Obra:</span> {budget.tipo_obra || 'N/A'}</div>
            <div><span className="font-semibold">Total Planeado:</span> {formatCurrency(budget.total_planeado)}</div>
            <div><span className="font-semibold">Total Executado:</span> {formatCurrency(budget.total_executado)}</div>
            <div><span className="font-semibold">Estado:</span> {budget.estado}</div>
            {budget.observacoes_gerais && <div><span className="font-semibold">Observações:</span> {budget.observacoes_gerais}</div>}
          </div>
        );
      case 'budget_item':
        const budgetItem = relatedEntityData as BudgetItemDB;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-semibold">Serviço:</span> {budgetItem.servico}</div>
            <div><span className="font-semibold">Capítulo:</span> {budgetItem.capitulo}</div>
            <div><span className="font-semibold">Quantidade:</span> {budgetItem.quantidade} {budgetItem.unidade}</div>
            <div><span className="font-semibold">Preço Unitário:</span> {formatCurrency(budgetItem.preco_unitario)}</div>
            <div><span className="font-semibold">Custo Planeado:</span> {formatCurrency(budgetItem.custo_planeado)}</div>
            <div><span className="font-semibold">Custo Executado:</span> {formatCurrency(budgetItem.custo_executado)}</div>
            <div><span className="font-semibold">Estado:</span> {budgetItem.estado}</div>
          </div>
        );
      case 'rdo_entry':
        const rdoEntry = relatedEntityData as RdoEntry & { responsible_user?: { first_name: string; last_name: string; avatar_url: string | null } };
        const responsibleUser = rdoEntry.responsible_user;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-semibold">Data:</span> {format(parseISO(rdoEntry.date), "dd/MM/yyyy", { locale: pt })}</div>
            <div><span className="font-semibold">Tipo de Evento:</span> {rdoEntry.event_type}</div>
            <div className="md:col-span-2"><span className="font-semibold">Descrição:</span> {rdoEntry.description}</div>
            {responsibleUser && <div><span className="font-semibold">Responsável:</span> {responsibleUser.first_name} {responsibleUser.last_name}</div>}
            {rdoEntry.observations && <div className="md:col-span-2"><span className="font-semibold">Observações:</span> {rdoEntry.observations}</div>}
            {rdoEntry.attachments_url && rdoEntry.attachments_url.length > 0 && (
              <div className="md:col-span-2">
                <span className="font-semibold">Anexos: </span>
                {rdoEntry.attachments_url.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mr-2">
                    Anexo {i + 1} <Download className="inline-block h-3 w-3 ml-1" />
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      case 'schedule_task':
        // Assuming ScheduleTask has similar fields to BudgetItem for display
        const scheduleTask = relatedEntityData as any; // Use 'any' for now if schema not fully defined
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-semibold">Capítulo/Fase:</span> {scheduleTask.capitulo}</div>
            <div><span className="font-semibold">Ordem:</span> {scheduleTask.ordem}</div>
            <div><span className="font-semibold">Data Início:</span> {scheduleTask.data_inicio ? format(parseISO(scheduleTask.data_inicio), "dd/MM/yyyy", { locale: pt }) : 'N/A'}</div>
            <div><span className="font-semibold">Data Fim:</span> {scheduleTask.data_fim ? format(parseISO(scheduleTask.data_fim), "dd/MM/yyyy", { locale: pt }) : 'N/A'}</div>
            <div><span className="font-semibold">Progresso:</span> {scheduleTask.progresso}%</div>
            <div><span className="font-semibold">Estado:</span> {scheduleTask.estado}</div>
          </div>
        );
      default:
        return <p className="text-muted-foreground">Detalhes não disponíveis para este tipo de entidade.</p>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Detalhes da Aprovação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-semibold">Tipo de Aprovação:</span> {approval.entity_type.replace('_', ' ')}</div>
            <div><span className="font-semibold">Obra:</span> {approval.projects?.nome || "N/A"}</div>
            <div><span className="font-semibold">Descrição:</span> {approval.description}</div>
            <div><span className="font-semibold">Estado Atual:</span> {approval.status.replace('_', ' ')}</div>
            <div><span className="font-semibold">Solicitado por:</span> {approval.requested_by_user?.first_name} {approval.requested_by_user?.last_name}</div>
            <div><span className="font-semibold">Data do Pedido:</span> {approval.requested_at ? format(parseISO(approval.requested_at), "dd/MM/yyyy HH:mm", { locale: pt }) : "N/A"}</div>
            {approval.reason && <div className="md:col-span-2"><span className="font-semibold">Razão do Pedido:</span> {approval.reason}</div>}
            {approval.attachments_url && approval.attachments_url.length > 0 && (
              <div className="md:col-span-2">
                <span className="font-semibold">Anexos: </span>
                {approval.attachments_url.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mr-2">
                    Anexo {i + 1} <Download className="inline-block h-3 w-3 ml-1" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <h3 className="text-lg font-semibold mb-2">Contexto da Entidade</h3>
          {renderRelatedEntityDetails()}

          <Separator className="my-4" />

          <h3 className="text-lg font-semibold mb-2">Ações de Aprovação</h3>
          {isPending ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleApprovalAction("approved")} disabled={isProcessingApproval}>
                {isProcessingApproval ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckSquare className="h-4 w-4 mr-2" />} Aprovar
              </Button>
              <Button variant="outline" onClick={() => openCommentDialog("changes_requested")} disabled={isProcessingApproval}>
                {isProcessingApproval ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquareMore className="h-4 w-4 mr-2" />} Solicitar Alterações
              </Button>
              <Button variant="destructive" onClick={() => openCommentDialog("rejected")} disabled={isProcessingApproval}>
                {isProcessingApproval ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />} Rejeitar
              </Button>
            </div>
          ) : (
            <div className={cn(
              "p-4 rounded-md flex items-center gap-3",
              approval.status === 'approved' && "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700",
              approval.status === 'rejected' && "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700",
              approval.status === 'changes_requested' && "bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700",
            )}>
              <Info className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold capitalize">Decisão: {approval.status.replace('_', ' ')}</p>
                <p className="text-sm">Por: {approval.decision_by_user?.first_name} {approval.decision_by_user?.last_name} em {approval.decision_at ? format(parseISO(approval.decision_at), "dd/MM/yyyy HH:mm", { locale: pt }) : "N/A"}</p>
                {approval.comments && <p className="text-sm italic">Comentários: "{approval.comments}"</p>}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          <h3 className="text-lg font-semibold mb-2">Histórico de Aprovação</h3>
          {isLoadingHistory ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : approvalHistory.length > 0 ? (
            <div className="relative pl-8">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              {approvalHistory.map((historyItem, index) => (
                <div key={historyItem.id} className="mb-6 last:mb-0">
                  <div className="relative flex items-center mb-2">
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white -translate-x-1/2">
                      {historyItem.action_type === 'approved' && <CheckSquare className="h-4 w-4" />}
                      {historyItem.action_type === 'rejected' && <XCircle className="h-4 w-4" />}
                      {historyItem.action_type === 'changes_requested' && <MessageSquareMore className="h-4 w-4" />}
                      {historyItem.action_type === 'requested' && <CalendarDays className="h-4 w-4" />}
                    </div>
                    <span className="ml-8 font-medium capitalize">{historyItem.action_type.replace('_', ' ')}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {historyItem.action_at ? format(parseISO(historyItem.action_at), "dd/MM/yyyy HH:mm", { locale: pt }) : "N/A"}
                    </span>
                  </div>
                  <div className="ml-8 p-3 border rounded-md bg-muted/20">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={historyItem.action_by_user?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{getUserInitials(historyItem.action_by_user)}</AvatarFallback>
                      </Avatar>
                      <span>Por: {historyItem.action_by_user?.first_name} {historyItem.action_by_user?.last_name}</span>
                    </div>
                    {historyItem.comments && <p className="text-sm mt-2">Comentários: "{historyItem.comments}"</p>}
                    {historyItem.old_status && historyItem.new_status && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Estado: <span className="capitalize">{historyItem.old_status.replace('_', ' ')}</span> {"->"} <span className="capitalize">{historyItem.new_status.replace('_', ' ')}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum histórico de aprovação encontrado.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{commentActionType === "rejected" ? "Rejeitar Aprovação" : "Solicitar Alterações"}</DialogTitle>
            <DialogDescription>
              Por favor, forneça um comentário para justificar esta ação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="comments">Comentários</Label>
              <Textarea
                id="comments"
                placeholder="Explique o motivo da rejeição ou as alterações necessárias..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmitComment} disabled={isSubmittingComment || !commentText.trim()}>
              {isSubmittingComment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalDetailView;