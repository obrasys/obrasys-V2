"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BudgetWithRelations,
  BudgetItem,
} from "@/schemas/budget-schema";
import { Loader2, DollarSign } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import BudgetFinancialSummary from "@/components/budgeting/BudgetFinancialSummary";
import BudgetDetailTable from "@/components/budgeting/BudgetDetailTable";
import { createBudgetColumns } from "@/components/budgeting/columns";
import { formatDate } from "@/utils/formatters";

interface ProjectBudgetDetailsProps {
  budgetId: string;
  projectId: string;
}

const ProjectBudgetDetails: React.FC<
  ProjectBudgetDetailsProps
> = ({ budgetId, projectId }) => {
  const [budget, setBudget] =
    React.useState<BudgetWithRelations | null>(
      null
    );
  const [isLoading, setIsLoading] =
    React.useState(true);

  const fetchBudgetDetails =
    React.useCallback(async () => {
      let isMounted = true;
      setIsLoading(true);

      const { data, error } = await supabase
        .from("budgets")
        .select(
          `
          id,
          company_id,
          project_id,
          nome,
          client_id,
          localizacao,
          tipo_obra,
          data_orcamento,
          observacoes_gerais,
          total_planeado,
          total_executado,
          estado,
          created_at,
          updated_at,
          clients (
            nome
          ),
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
        `
        )
        .eq("id", budgetId)
        .eq("project_id", projectId)
        .single();

      if (!isMounted) return;

      if (error) {
        console.error(error);
        toast.error(
          `Erro ao carregar detalhes do orçamento: ${error.message}`
        );
        setBudget(null);
        setIsLoading(false);
        return;
      }

      if (data) {
        const formatted: BudgetWithRelations =
          {
            ...data,
            clients: data.clients ?? null,
            budget_chapters: (
              data.budget_chapters ?? []
            ).map((chapter) => ({
              ...chapter,
              budget_items: (
                chapter.budget_items ?? []
              ).map((item) => {
                const material =
                  item.custo_real_material ??
                  0;
                const maoObra =
                  item.custo_real_mao_obra ??
                  0;

                const custoReal =
                  item.custo_executado ??
                  material + maoObra;

                return {
                  ...item,
                  desvio:
                    custoReal -
                    (item.custo_planeado ??
                      0),
                };
              }),
            })),
          };

        setBudget(formatted);
      }

      setIsLoading(false);

      return () => {
        isMounted = false;
      };
    }, [budgetId, projectId]);

  React.useEffect(() => {
    fetchBudgetDetails();
  }, [fetchBudgetDetails]);

  const handleViewBudgetItem = (
    item: BudgetItem
  ) => {
    toast.info(
      `Visualizar serviço: ${item.servico}`
    );
  };

  const handleEditBudgetItem = (
    item: BudgetItem
  ) => {
    toast.info(
      `Editar serviço: ${item.servico}`
    );
  };

  const columns = createBudgetColumns({
    onView: handleViewBudgetItem,
    onEdit: handleEditBudgetItem,
  });

  const allBudgetItems: BudgetItem[] =
    budget
      ? budget.budget_chapters.flatMap(
          (c) => c.budget_items
        )
      : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">
          A carregar detalhes do orçamento…
        </p>
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
          <CardTitle className="text-xl font-semibold">
            Informações do Orçamento
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>Nome:</strong>{" "}
            {budget.nome}
          </div>
          <div>
            <strong>Cliente:</strong>{" "}
            {budget.clients?.nome ??
              "N/A"}
          </div>
          <div>
            <strong>Localização:</strong>{" "}
            {budget.localizacao ??
              "N/A"}
          </div>
          <div>
            <strong>Tipo de Obra:</strong>{" "}
            {budget.tipo_obra ??
              "N/A"}
          </div>
          <div>
            <strong>Data:</strong>{" "}
            {budget.data_orcamento
              ? formatDate(
                  budget.data_orcamento
                )
              : "N/A"}
          </div>
          <div>
            <strong>Estado:</strong>{" "}
            {budget.estado}
          </div>

          {budget.observacoes_gerais && (
            <div className="md:col-span-2">
              <strong>
                Observações:
              </strong>{" "}
              {budget.observacoes_gerais}
            </div>
          )}
        </CardContent>
      </Card>

      <BudgetFinancialSummary
        currentBudgetTotal={
          budget.total_planeado
        }
        totalExecuted={
          budget.total_executado
        }
      />

      <BudgetDetailTable
        allBudgetItems={allBudgetItems}
        columns={columns}
      />
    </div>
  );
};

export default ProjectBudgetDetails;
