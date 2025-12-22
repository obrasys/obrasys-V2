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

export function useClientProjectActions({
  userCompanyId,
  fetchClients,
  setIsClientDialogOpen,
  setIsProjectDialogOpen,
  approvedBudgetId,
  form,
}: UseClientProjectActionsProps): UseClientProjectActionsResult {
  const navigate = useNavigate();

  const handleSaveClient = async (newClient: Client) => {
    if (!userCompanyId) {
      toast.error("ID da empresa não encontrado. Por favor, faça login novamente.");
      return;
    }
    try {
      const clientDataToSave = {
        ...newClient,
        company_id: userCompanyId,
        id: newClient.id || uuidv4(),
      };

      const { data, error } = await supabase
        .from('clients')
        .upsert(clientDataToSave)
        .select()
        .single();

      if (error) throw error;

      await fetchClients();
      form.setValue("client_id", data.id || null);
      toast.success(`Cliente ${data.nome} registado com sucesso!`);
      setIsClientDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao registar cliente: ${error.message}`);
      console.error("handleSaveClient: Caught error:", error);
    }
  };

  const handleSaveProject = async (newProject: Project) => {
    if (!approvedBudgetId || !userCompanyId) {
      toast.error("Nenhum orçamento aprovado para associar à obra ou ID da empresa não encontrado.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('projects')
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
        .select()
        .single();

      if (error) throw error;

      const { error: updateBudgetError } = await supabase
        .from('budgets')
        .update({ project_id: data.id })
        .eq('id', approvedBudgetId);

      if (updateBudgetError) throw updateBudgetError;

      toast.success(`Obra "${newProject.nome}" criada e ligada ao orçamento!`);
      setIsProjectDialogOpen(false);
      navigate(`/projects`);
    } catch (error: any) {
      toast.error(`Erro ao criar obra: ${error.message}`);
      console.error("handleSaveProject: Caught error:", error);
    }
  };

  return {
    handleSaveClient,
    handleSaveProject,
  };
}