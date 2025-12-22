"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CheckSquare, PlusCircle, Filter, RefreshCw, ArrowLeft, Loader2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ApprovalWithRelations } from "@/schemas/approval-schema";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

// Components for this module
import ApprovalsDashboard from "@/components/approvals/ApprovalsDashboard";
import ApprovalDetailView from "@/components/approvals/ApprovalDetailView";

const ApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);
  const [approvals, setApprovals] = React.useState<ApprovalWithRelations[]>([]);
  const [selectedApproval, setSelectedApproval] = React.useState<ApprovalWithRelations | null>(null);
  const [isLoadingApprovals, setIsLoadingApprovals] = React.useState(true);
  const [isProcessingApproval, setIsProcessingApproval] = React.useState(false);

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

  // Fetch approvals for the current company
  const fetchApprovals = React.useCallback(async () => {
    if (!userCompanyId) {
      setApprovals([]);
      setIsLoadingApprovals(false);
      return;
    }
    setIsLoadingApprovals(true);
    const { data, error } = await supabase
      .from('approvals')
      .select(`
        *,
        projects(nome),
        requested_by_user:profiles!approvals_requested_by_user_id_fkey(first_name, last_name, avatar_url),
        decision_by_user:profiles!approvals_decision_by_user_id_fkey(first_name, last_name, avatar_url)
      `)
      .eq('company_id', userCompanyId)
      .order('requested_at', { ascending: false });

    if (error) {
      toast.error(`Erro ao carregar aprovações: ${error.message}`);
      console.error("Erro ao carregar aprovações:", error);
      setApprovals([]);
    } else {
      setApprovals(data || []);
      // If an approval was selected, try to re-select it with updated data
      if (selectedApproval) {
        const updatedSelected = (data || []).find(a => a.id === selectedApproval.id);
        setSelectedApproval(updatedSelected || null);
      }
    }
    setIsLoadingApprovals(false);
  }, [userCompanyId, selectedApproval]);

  React.useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
  }, [isSessionLoading, fetchUserCompanyId]);

  React.useEffect(() => {
    if (userCompanyId) {
      fetchApprovals();
    }
  }, [userCompanyId, fetchApprovals]);

  const handleSelectApproval = (approval: ApprovalWithRelations) => {
    setSelectedApproval(approval);
  };

  const handleBackToList = () => {
    setSelectedApproval(null);
  };

  // Placeholder for future "Create New Approval" functionality
  const handleCreateNewApproval = () => {
    toast.info("Funcionalidade de criar nova aprovação manual em desenvolvimento.");
    // navigate("/approvals/new"); // Future route
  };

  if (isLoadingApprovals) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40 mt-2 md:mt-0" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Gestão de Aprovações</h1>
          <p className="text-muted-foreground text-sm">
            Centralize e rastreie todos os fluxos de aprovação da sua obra.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          {selectedApproval && (
            <Button variant="ghost" onClick={handleBackToList} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Voltar à Lista
            </Button>
          )}
          <Button onClick={fetchApprovals} disabled={isLoadingApprovals || isProcessingApproval} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button onClick={handleCreateNewApproval} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Nova Aprovação
          </Button>
        </div>
      </div>

      {selectedApproval ? (
        <ApprovalDetailView
          approval={selectedApproval}
          onApprovalAction={fetchApprovals} // Callback to refresh list after action
          setIsProcessingApproval={setIsProcessingApproval}
        />
      ) : (
        <ApprovalsDashboard
          approvals={approvals}
          onSelectApproval={handleSelectApproval}
          isLoading={isLoadingApprovals}
        />
      )}
    </div>
  );
};

export default ApprovalsPage;