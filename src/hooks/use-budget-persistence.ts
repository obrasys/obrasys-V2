"use client";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { NewBudgetFormValues, BudgetWithRelations } from "@/schemas/budget-schema";
import { User } from "@supabase/supabase-js";

interface UseBudgetPersistenceProps {
  userCompanyId: string | null;
  user: User | null;
}

interface UseBudgetPersistenceResult {
  saveBudget: (data: NewBudgetFormValues, totalPlanned: number, totalExecuted: number) => Promise<string | null>;
  approveBudget: (budgetId: string, totalExecuted: number) => Promise<boolean>;
}

export function useBudgetPersistence({ userCompanyId, user }: UseBudgetPersistenceProps): UseBudgetPersistenceResult {

  const saveBudget = async (data: NewBudgetFormValues, totalPlanned: number, totalExecuted: number): Promise<string | null> => {
    if (!user || !userCompanyId) {
      toast.error("Utilizador não autenticado ou ID da empresa não encontrado. Por favor, faça login novamente.");
      console.error("saveBudget: Aborting save - user or userCompanyId is missing.");
      return null;
    }

    try {
      const companyId = userCompanyId;
      let currentBudgetId = data.id;

      if (currentBudgetId) {
        // EDITING EXISTING BUDGET
        const budgetPayload = {
          nome: data.nome,
          client_id: data.client_id,
          localizacao: data.localizacao,
          tipo_obra: data.tipo_obra,
          data_orcamento: data.data_orcamento,
          observacoes_gerais: data.observacoes_gerais,
          total_planeado: totalPlanned,
          total_executado: totalExecuted,
          estado: data.estado,
          updated_at: new Date().toISOString(),
        };

        const { error: budgetUpdateError } = await supabase
          .from('budgets')
          .update(budgetPayload)
          .eq('id', currentBudgetId);

        if (budgetUpdateError) {
          throw new Error(`Erro ao atualizar orçamento principal: ${budgetUpdateError.message}`);
        }

        // Delete existing chapters and items for this budget
        await supabase.from('budget_items').delete().eq('budget_id', currentBudgetId);
        const { error: deleteChaptersError } = await supabase.from('budget_chapters').delete().eq('budget_id', currentBudgetId);
        if (deleteChaptersError) {
          throw new Error(`Erro ao eliminar capítulos antigos: ${deleteChaptersError.message}`);
        }

      } else {
        // CREATING NEW BUDGET
        const budgetPayload = {
          company_id: companyId,
          nome: data.nome,
          client_id: data.client_id,
          localizacao: data.localizacao,
          tipo_obra: data.tipo_obra,
          data_orcamento: data.data_orcamento,
          observacoes_gerais: data.observacoes_gerais,
          project_id: null,
          total_planeado: totalPlanned,
          total_executado: totalExecuted,
          estado: data.estado,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: newBudgetData, error: budgetError } = await supabase
          .from('budgets')
          .insert(budgetPayload)
          .select()
          .single();

        if (budgetError) {
          throw new Error(`Erro ao criar orçamento principal: ${budgetError.message}`);
        }
        currentBudgetId = newBudgetData.id;
      }

      // Insert all chapters and their items (for both new and updated budgets)
      for (const chapter of data.chapters) {
        const chapterPayload = {
          budget_id: currentBudgetId,
          company_id: companyId,
          title: chapter.nome,
          code: chapter.codigo,
          sort_order: 0, // Placeholder, could be chapterIndex
          notes: chapter.observacoes,
          subtotal: 0, // Will be updated by trigger
          created_at: new Date().toISOString(),
        };

        const { data: chapterData, error: chapterError } = await supabase
          .from('budget_chapters')
          .insert(chapterPayload)
          .select()
          .single();

        if (chapterError) {
          throw new Error(`Erro ao criar capítulo '${chapter.nome}': ${chapterError.message}`);
        }

        const budgetItemsToInsert = chapter.items.map((item) => ({
          company_id: companyId,
          budget_id: currentBudgetId,
          chapter_id: chapterData.id, // Link to the newly created chapter
          capitulo: item.capitulo,
          servico: item.servico,
          quantidade: item.quantidade,
          unidade: item.unidade,
          preco_unitario: item.preco_unitario,
          custo_planeado: item.custo_planeado,
          custo_executado: item.custo_executado,
          custo_real_material: item.custo_real_material,
          custo_real_mao_obra: item.custo_real_mao_obra,
          estado: item.estado,
          observacoes: "", // Add observacoes if needed in schema
          article_id: item.article_id,
        }));

        const { error: itemsError } = await supabase
          .from('budget_items')
          .insert(budgetItemsToInsert);

        if (itemsError) {
          throw new Error(`Erro ao inserir itens para o capítulo '${chapter.nome}': ${itemsError.message}`);
        }
      }
      toast.success(`Orçamento ${data.id ? "atualizado" : "criado"} com sucesso!`);
      return currentBudgetId;
    } catch (error: any) {
      toast.error(`Erro ao guardar orçamento: ${error.message}`);
      console.error("saveBudget: Caught error during budget operation:", error);
      return null;
    }
  };

  const approveBudget = async (budgetId: string, totalExecuted: number): Promise<boolean> => {
    try {
      const { data: updatedBudget, error: updateError } = await supabase
        .from('budgets')
        .update({
          estado: "Aprovado",
          total_executado: totalExecuted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', budgetId)
        .select()
        .single();

      if (updateError) throw updateError;

      toast.success("Orçamento aprovado com sucesso!");
      return true;
    } catch (error: any) {
      toast.error(`Erro ao aprovar orçamento: ${error.message}`);
      console.error("approveBudget: Caught error during budget approval:", error);
      return false;
    }
  };

  return {
    saveBudget,
    approveBudget,
  };
}