"use client";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Client } from "@/schemas/client-schema";
import { Project } from "@/schemas/project-schema";
import { UseFormReturn } from "react-hook-form";
import { NewBudgetFormValues } from "@/schemas/budget-schema";
import { useNavigate } from "react-router-dom";

interface UseClientProjectActionsProps {
  userCompanyId: string | null;
  fetchClients: () => Promise<void>;
  setIsClientDialogOpen: (isOpen: boolean) => void;
  setIsProjectDialogOpen: (isOpen: boolean) => void;
  approvedBudgetId: string | null;
  form: UseFormReturn<NewBudgetFormValues>;
}

interface UseClientProjectActionsResult {
  handleSaveClient: (newClient: Client) => Promise<void>;
  handleSaveProject: (newProject: Project) => Promise<void>;
}

function getErrorMessage(err: unknown): string {
  if (!err) return "Erro desconhecido";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  const anyErr = err as any;
  return anyErr?.message ?? "Erro desconhecido";
}

export function useClientProjectActions({
  userCompanyId,
  fetchClients,
  setIsClientDialogOpen,
  setIsProjectDialogOpen,
  approvedBudgetId,
  form,
}: UseClientProjectActionsProps): UseClientProjectActionsResult {
  const navigate = useNavigate();

  const handleSaveClient = async (newClient: Client): Promise<void> => {
    if (!userCompanyId) {
      toast.error(
        "ID da empresa não encontrado. Faça login novamente."
      );
      console.error(
        "[useClientProjectActions.handleSaveClient] missing userCompanyId"
      );
      return;
    }

    try {
      const clientDataToSave: Client = {
        ...newClient,
        company_id: userCompanyId,
        id: newClient.id || uuidv4(),
      };

      const { data, error } = await supabase
        .from("clients")
        .upsert(clientDataToSave)
        .select()
        .single();

      if (error) {
        console.error(
          "[useClientProjectActions.handleSaveClient] clients.upsert error",
          error
        );
        toast.error(`Erro ao registar cliente: ${error.message}`);
        return;
      }

      if (!data?.id) {
        console.error(
          "[useClientProjectActions.handleSaveClient] clients.upsert returned no id",
          data
        );
        toast.error("Erro ao registar cliente: ID não retornado.");
        return;
      }

      await fetchClients();

      form.setValue("client_id", data.id);
      toast.success(`Cliente "${data.nome}" registado com sucesso!`);
      setIsClientDialogOpen(false);
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(`Erro ao registar cliente: ${msg}`);
      console.error(
        "[useClientProjectActions.handleSaveClient] unexpected error",
        err
      );
    }
  };

  const handleSaveProject = async (newProject: Project): Promise<void> => {
    if (!approvedBudgetId || !userCompanyId) {
      toast.error(
        "Nenhum orçamento aprovado para associar à obra ou empresa inválida."
      );
      console.error(
        "[useClientProjectActions.handleSaveProject] missing approvedBudgetId or userCompanyId",
        { approvedBudgetId, userCompanyId }
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          id: newProject.id,
          nome: newProject.nome,
          client_id: newProject.client_id,
          localizacao: newProject.localizacao,
          estado: newProject.estado,
          progresso: newProject.progresso,
          prazo: newProject.prazo,
          custo_planeado: newProject.custo_planeado,
          custo_real: newProject.custo_real,
          budget_id: approvedBudgetId,
          company_id: userCompanyId,
        })
        .select("id, nome")
        .single();

      if (error) {
        console.error(
          "[useClientProjectActions.handleSaveProject] projects.insert error",
          error
        );
        toast.error(`Erro ao criar obra: ${error.message}`);
        return;
      }

      if (!data?.id) {
        console.error(
          "[useClientProjectActions.handleSaveProject] projects.insert returned no id",
          data
        );
        toast.error("Erro ao criar obra: ID não retornado.");
        return;
      }

      const { error: updateBudgetError } = await supabase
        .from("budgets")
        .update({ project_id: data.id })
        .eq("id", approvedBudgetId);

      if (updateBudgetError) {
        console.error(
          "[useClientProjectActions.handleSaveProject] budgets.update error",
          updateBudgetError
        );
        toast.error(
          `Obra criada, mas falhou a ligação ao orçamento: ${updateBudgetError.message}`
        );
        return;
      }

      toast.success(`Obra "${data.nome}" criada e ligada ao orçamento!`);
      setIsProjectDialogOpen(false);
      navigate("/projects");
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(`Erro ao criar obra: ${msg}`);
      console.error(
        "[useClientProjectActions.handleSaveProject] unexpected error",
        err
      );
    }
  };

  return {
    handleSaveClient,
    handleSaveProject,
  };
}
