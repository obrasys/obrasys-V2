"use client";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewBudgetFormValues } from "@/schemas/budget-schema";
import { User } from "@supabase/supabase-js";

interface UseBudgetPersistenceProps {
  userCompanyId: string | null;
  user: User | null;
}

interface UseBudgetPersistenceResult {
  saveBudget: (
    data: NewBudgetFormValues,
    totalPlanned: number,
    totalExecuted: number
  ) => Promise<string | null>;
  approveBudget: (budgetId: string, totalExecuted: number) => Promise<boolean>;
}

function getErrorMessage(err: unknown): string {
  if (!err) return "Erro desconhecido";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  // supabase pode devolver objetos com message
  const anyErr = err as any;
  return anyErr?.message ?? "Erro desconhecido";
}

export function useBudgetPersistence({
  userCompanyId,
  user,
}: UseBudgetPersistenceProps): UseBudgetPersistenceResult {
  const saveBudget = async (
    data: NewBudgetFormValues,
    totalPlanned: number,
    totalExecuted: number
  ): Promise<string | null> => {
    if (!user || !userCompanyId) {
      toast.error(
        "Utilizador não autenticado ou empresa não encontrada. Faça login novamente."
      );
      console.error("[useBudgetPersistence.saveBudget] missing user/company", {
        user: !!user,
        userCompanyId,
      });
      return null;
    }

    const companyId = userCompanyId;

    try {
      let currentBudgetId = data.id ?? null;

      // =========================
      // 1) CREATE or UPDATE BUDGET
      // =========================
      if (currentBudgetId) {
        // UPDATE EXISTING
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
          .from("budgets")
          .update(budgetPayload)
          .eq("id", currentBudgetId);

        if (budgetUpdateError) {
          console.error(
            "[useBudgetPersistence.saveBudget] budgets.update error",
            budgetUpdateError
          );
          toast.error(
            `Erro ao atualizar orçamento: ${budgetUpdateError.message}`
          );
          return null;
        }

        // =========================
        // 2) DELETE OLD CHAPTERS + ITEMS
        // =========================
        const { error: deleteItemsError } = await supabase
          .from("budget_items")
          .delete()
          .eq("budget_id", currentBudgetId);

        if (deleteItemsError) {
          console.error(
            "[useBudgetPersistence.saveBudget] budget_items.delete error",
            deleteItemsError
          );
          toast.error(
            `Erro ao eliminar itens antigos: ${deleteItemsError.message}`
          );
          return null;
        }

        const { error: deleteChaptersError } = await supabase
          .from("budget_chapters")
          .delete()
          .eq("budget_id", currentBudgetId);

        if (deleteChaptersError) {
          console.error(
            "[useBudgetPersistence.saveBudget] budget_chapters.delete error",
            deleteChaptersError
          );
          toast.error(
            `Erro ao eliminar capítulos antigos: ${deleteChaptersError.message}`
          );
          return null;
        }
      } else {
        // CREATE NEW
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
          .from("budgets")
          .insert(budgetPayload)
          .select("id")
          .single();

        if (budgetError) {
          console.error(
            "[useBudgetPersistence.saveBudget] budgets.insert error",
            budgetError
          );
          toast.error(`Erro ao criar orçamento: ${budgetError.message}`);
          return null;
        }

        if (!newBudgetData?.id) {
          console.error(
            "[useBudgetPersistence.saveBudget] budgets.insert returned no id",
            newBudgetData
          );
          toast.error("Erro ao criar orçamento: ID não retornado.");
          return null;
        }

        currentBudgetId = newBudgetData.id;
      }

      // Segurança extra
      if (!currentBudgetId) {
        console.error(
          "[useBudgetPersistence.saveBudget] currentBudgetId missing after create/update"
        );
        toast.error("Erro ao guardar orçamento: ID inválido.");
        return null;
      }

      // =========================
      // 3) INSERT CHAPTERS + ITEMS
      // =========================
      for (const chapter of data.chapters) {
        const chapterPayload = {
          budget_id: currentBudgetId,
          company_id: companyId,
          title: chapter.nome,
          code: chapter.codigo,
          sort_order: 0, // podes trocar por index se quiseres (chapterIndex)
          notes: chapter.observacoes,
          subtotal: 0, // trigger pode recalcular
          created_at: new Date().toISOString(),
        };

        const { data: chapterData, error: chapterError } = await supabase
          .from("budget_chapters")
          .insert(chapterPayload)
          .select("id")
          .single();

        if (chapterError) {
          console.error(
            "[useBudgetPersistence.saveBudget] budget_chapters.insert error",
            { chapter: chapter.nome, error: chapterError }
          );
          toast.error(
            `Erro ao criar capítulo "${chapter.nome}": ${chapterError.message}`
          );
          return null;
        }

        const chapterId = chapterData?.id;
        if (!chapterId) {
          console.error(
            "[useBudgetPersistence.saveBudget] budget_chapters.insert returned no id",
            { chapter: chapter.nome, chapterData }
          );
          toast.error(`Erro ao criar capítulo "${chapter.nome}": ID não retornado.`);
          return null;
        }

        const budgetItemsToInsert = chapter.items.map((item) => ({
          company_id: companyId,
          budget_id: currentBudgetId,
          chapter_id: chapterId,
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
          observacoes: "", // se o schema suportar, podes mapear
          article_id: item.article_id,
        }));

        // Se não houver itens, segue (não falhar)
        if (budgetItemsToInsert.length > 0) {
          const { error: itemsError } = await supabase
            .from("budget_items")
            .insert(budgetItemsToInsert);

          if (itemsError) {
            console.error(
              "[useBudgetPersistence.saveBudget] budget_items.insert error",
              { chapter: chapter.nome, error: itemsError }
            );
            toast.error(
              `Erro ao inserir itens do capítulo "${chapter.nome}": ${itemsError.message}`
            );
            return null;
          }
        }
      }

      toast.success(`Orçamento ${data.id ? "atualizado" : "criado"} com sucesso!`);
      return currentBudgetId;
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(`Erro ao guardar orçamento: ${msg}`);
      console.error("[useBudgetPersistence.saveBudget] unexpected error", err);
      return null;
    }
  };

  const approveBudget = async (
    budgetId: string,
    totalExecuted: number
  ): Promise<boolean> => {
    if (!budgetId) {
      toast.error("ID do orçamento inválido.");
      console.error("[useBudgetPersistence.approveBudget] missing budgetId");
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from("budgets")
        .update({
          estado: "Aprovado",
          total_executado: totalExecuted,
          updated_at: new Date().toISOString(),
        })
        .eq("id", budgetId);

      if (updateError) {
        console.error(
          "[useBudgetPersistence.approveBudget] budgets.update error",
          updateError
        );
        toast.error(`Erro ao aprovar orçamento: ${updateError.message}`);
        return false;
      }

      toast.success("Orçamento aprovado com sucesso!");
      return true;
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(`Erro ao aprovar orçamento: ${msg}`);
      console.error("[useBudgetPersistence.approveBudget] unexpected error", err);
      return false;
    }
  };

  return {
    saveBudget,
    approveBudget,
  };
}
