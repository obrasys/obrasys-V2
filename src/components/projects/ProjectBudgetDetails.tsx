"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BudgetWithRelations, BudgetItem } from "@/schemas/budget-schema";
import { Loader2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { DollarSign } from "lucide-react";
import BudgetFinancialSummary from "@/components/budgeting/BudgetFinancialSummary";
import BudgetDetailTable from "@/components/budgeting/BudgetDetailTable";
import { createBudgetColumns } from "@/components/budgeting/columns";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface ProjectBudgetDetailsProps {
  budgetId: string;
  projectId: string;
}

const ProjectBudgetDetails: React.FC<ProjectBudgetDetailsProps> = ({ budgetId, projectId }) => {
  const [budget, setBudget] = React.useState<BudgetWithRelations | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchBudgetDetails = React.useCallback(async () => {
    setIsLoading(true);
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select(`
        id, company_id, project_id, nome, client_id, localizacao, tipo_obra, data_orcamento, observacoes_gerais, total_planeado, total_executado, estado, created_at, updated_at,
        clients(nome),
        budget_chapters (
          id,
          title,
          code,
          sort_order,
          notes,
          subtotal,
          budget_items (
            id,
            capitulo,
            servico,
            quantidade,
            unidade,
            preco_unitario,
            custo_planeado,
            custo_executado,
            custo_real_material,
            custo_real_mao_obra,
            estado,
            article_id
          )
        )
      `)
      .eq('id', budgetId)
      .eq('project_id', projectId)
      .single();

    if (budgetError) {
      toast.error(`Erro ao carregar detalhes do orçamento: ${budgetError.message}`);
      console.error("Erro ao carregar detalhes do orçamento:", budgetError);
      setBudget(null);
    } else if (budgetData) {
      const formattedBudget: BudgetWithRelations = {
        ...budgetData,
        clients: budgetData.clients || null,
        budget_chapters: (budgetData.budget_chapters || []).map((chapter: any) => ({
          ...chapter,
          budget_items: (chapter.budget_items || []).map((item: any) => ({
            ...item,
            desvio: ((item.custo_real_material || 0) + (item.custo_real_mao_obra || 0)) - item.custo_planeado,
          }))
        }))
      };
      setBudget(formattedBudget);
    }
    setIsLoading(false);
  }, [budgetId, projectId]);

  React.useEffect(() => {
    fetchBudgetDetails();
  }, [fetchBudgetDetails]);

  const handleViewBudgetItem = (budgetItem: BudgetItem) => {
    toast.info(`Visualizar detalhes do serviço: ${budgetItem.servico}`);
    // Implement navigation to budget item detail page if needed
  };

  const handleEditBudgetItem = (budgetItem: BudgetItem) => {
    toast.info(`Editar serviço: ${budgetItem.servico}`);
    // Implement dialog or form for editing
  };

  const columns = createBudgetColumns({
    onView: handleViewBudgetItem,
    onEdit: handleEditBudgetItem,
  });

  const allBudgetItems: BudgetItem[] = budget
    ? budget.budget_chapters.flatMap(chapter => chapter.budget_items)
    : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">A carregar detalhes do orçamento...</p>
      </div>
    );
  }

  if (!budget) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Orçamento não encontrado"
        description="Não foi possível carregar os detalhes do orçamento associado a esta obra."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Informações do Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><span className="font-semibold">Nome do Orçamento:</span> {budget.nome}</div>
          <div><span className="font-semibold">Cliente:</span> {budget.clients?.nome || "N/A"}</div>
          <div><span className="font-semibold">Localização:</span> {budget.localizacao || "N/A"}</div>
          <div><span className="font-semibold">Tipo de Obra:</span> {budget.tipo_obra || "N/A"}</div>
          <div><span className="font-semibold">Data do Orçamento:</span> {budget.data_orcamento ? formatDate(budget.data_orcamento) : "N/A"}</div>
          <div><span className="font-semibold">Estado:</span> {budget.estado}</div>
          {budget.observacoes_gerais && <div className="md:col-span-2"><span className="font-semibold">Observações Gerais:</span> {budget.observacoes_gerais}</div>}
        </CardContent>
      </Card>

      <BudgetFinancialSummary
        currentBudgetTotal={budget.total_planeado}
        totalExecuted={budget.total_executado}
      />

      <BudgetDetailTable
        allBudgetItems={allBudgetItems}
        columns={columns}
      />
    </div>
  );
};

export default ProjectBudgetDetails;