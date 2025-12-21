"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { NewBudgetFormValues, newBudgetFormSchema, BudgetItem } from "@/schemas/budget-schema";
import { Client } from "@/schemas/client-schema";
import { Project } from "@/schemas/project-schema";

interface UseNewBudgetFormProps {
  userCompanyId: string | null;
  fetchClients: () => Promise<void>;
  setIsClientDialogOpen: (isOpen: boolean) => void;
  setIsProjectDialogOpen: (isOpen: boolean) => void;
}

interface UseNewBudgetFormResult {
  form: ReturnType<typeof useForm<NewBudgetFormValues>>;
  onSubmit: (data: NewBudgetFormValues) => Promise<void>;
  handleApproveBudget: () => Promise<void>;
  handleSaveClient: (newClient: Client) => Promise<void>;
  handleSaveProject: (newProject: Project) => Promise<void>;
  isSaving: boolean;
  approvedBudgetId: string | null;
  currentBudgetTotal: number;
  isApproved: boolean;
  allValidationsComplete: boolean;
  hasMissingChapterDetails: boolean;
  hasEmptyChapters: boolean;
  hasMissingServiceDetails: boolean;
  calculateCosts: () => number;
}

export function useNewBudgetForm({
  userCompanyId,
  fetchClients,
  setIsClientDialogOpen,
  setIsProjectDialogOpen,
}: UseNewBudgetFormProps): UseNewBudgetFormResult {
  const navigate = useNavigate();
  const { user } = useSession();
  const [isSaving, setIsSaving] = React.useState(false);
  const [approvedBudgetId, setApprovedBudgetId] = React.useState<string | null>(null);

  const form = useForm<NewBudgetFormValues>({
    resolver: zodResolver(newBudgetFormSchema),
    defaultValues: {
      nome: "",
      client_id: null, // Alterado para null
      localizacao: "",
      tipo_obra: "Nova construção",
      data_orcamento: format(new Date(), "yyyy-MM-dd"),
      observacoes_gerais: "",
      estado: "Rascunho",
      chapters: [
        {
          id: uuidv4(),
          codigo: "01",
          nome: "Fundações",
          observacoes: "",
          items: [
            {
              id: uuidv4(),
              capitulo_id: null, // Alterado para null
              capitulo: "Fundações",
              servico: "Escavação manual em vala",
              quantidade: 1,
              unidade: "m³",
              preco_unitario: 0.01,
              custo_planeado: 0,
              custo_executado: 0,
              desvio: 0,
              estado: "Planeado",
              article_id: null,
            },
          ],
        },
      ],
    },
  });

  const calculateCosts = React.useCallback(() => {
    const currentChapters = form.getValues("chapters");
    let totalPlanned = 0;

    currentChapters.forEach((chapter, chapterIndex) => {
      chapter.items.forEach((item, itemIndex) => {
        const plannedCost = item.quantidade * item.preco_unitario;
        if (form.getValues(`chapters.${chapterIndex}.items.${itemIndex}.custo_planeado`) !== plannedCost) {
          form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.custo_planeado`, plannedCost);
        }
        totalPlanned += plannedCost;
      });
    });
    return totalPlanned;
  }, [form]);

  React.useEffect(() => {
    calculateCosts();
  }, [calculateCosts]);

  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name?.includes("quantidade") || name?.includes("preco_unitario")) {
        calculateCosts();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, calculateCosts]);

  const onSubmit = async (data: NewBudgetFormValues) => {
    console.log("--- onSubmit: Starting budget save process ---");
    console.log("Current form data:", data);
    console.log("User Company ID:", userCompanyId);

    if (!user || !userCompanyId) {
      toast.error("Utilizador não autenticado ou ID da empresa não encontrado. Por favor, faça login novamente.");
      console.error("onSubmit: Aborting save - user or userCompanyId is missing.");
      return;
    }
    setIsSaving(true);
    console.log("onSubmit: isSaving set to true.");

    try {
      const companyId = userCompanyId;
      // This check is redundant if the above `if` block handles `!userCompanyId`
      // if (!companyId) {
      //   throw new Error("ID da empresa não encontrado no perfil do utilizador.");
      // }
      console.log("onSubmit: Using companyId:", companyId);

      const initialTotalPlanned = calculateCosts(); 
      console.log("onSubmit: Calculated initial total planned cost:", initialTotalPlanned);

      // 1. Insert the main budget record
      console.log("onSubmit: Attempting to insert main budget record.");
      const budgetPayload = {
        company_id: companyId,
        nome: data.nome,
        client_id: data.client_id,
        project_id: null,
        total_planeado: initialTotalPlanned,
        total_executado: 0,
        estado: data.estado,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log("onSubmit: Budget payload:", budgetPayload);

      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .insert(budgetPayload)
        .select()
        .single();

      if (budgetError) {
        console.error("onSubmit: Supabase budget insertion error:", budgetError);
        throw new Error(`Erro ao criar orçamento principal: ${budgetError.message}`);
      }
      console.log("onSubmit: Main budget record inserted successfully:", budgetData);

      // 2. Insert budget chapters and their items
      for (const chapter of data.chapters) {
        console.log(`onSubmit: Attempting to insert budget chapter: ${chapter.nome}`);
        const chapterPayload = {
          budget_id: budgetData.id,
          company_id: companyId, // Adicionado: company_id para o capítulo
          title: chapter.nome,
          code: chapter.codigo,
          sort_order: 0, // Placeholder, could be chapterIndex
          notes: chapter.observacoes,
          subtotal: 0, // Will be updated by trigger
          created_at: new Date().toISOString(),
        };
        console.log("onSubmit: Chapter payload:", chapterPayload);

        const { data: chapterData, error: chapterError } = await supabase
          .from('budget_chapters')
          .insert(chapterPayload)
          .select()
          .single();

        if (chapterError) {
          console.error("onSubmit: Supabase budget chapter insertion error:", chapterError);
          throw new Error(`Erro ao criar capítulo '${chapter.nome}': ${chapterError.message}`);
        }
        console.log("onSubmit: Budget chapter inserted successfully:", chapterData);

        const budgetItemsToInsert = chapter.items.map((item) => ({
          company_id: companyId,
          budget_id: budgetData.id,
          chapter_id: chapterData.id, // Link to the newly created chapter
          capitulo: item.capitulo,
          servico: item.servico,
          quantidade: item.quantidade,
          unidade: item.unidade,
          preco_unitario: item.preco_unitario,
          custo_planeado: item.custo_planeado,
          custo_executado: 0,
          estado: item.estado,
          observacoes: "", // Add observacoes if needed in schema
          article_id: item.article_id,
        }));
        console.log(`onSubmit: Budget items to insert for chapter ${chapter.nome}:`, budgetItemsToInsert);

        const { error: itemsError } = await supabase
          .from('budget_items')
          .insert(budgetItemsToInsert);

        if (itemsError) {
          console.error("onSubmit: Supabase budget items insertion error:", itemsError);
          throw new Error(`Erro ao inserir itens para o capítulo '${chapter.nome}': ${itemsError.message}`);
        }
        console.log(`onSubmit: Budget items for chapter ${chapter.nome} inserted successfully.`);
      }

      toast.success("Orçamento criado com sucesso!");
      navigate("/budgeting");
    } catch (error: any) {
      toast.error(`Erro ao criar orçamento: ${error.message}`);
      console.error("onSubmit: Caught error during budget creation:", error);
    } finally {
      setIsSaving(false);
      console.log("--- onSubmit: Budget save process finished ---");
    }
  };

  const handleSaveClient = async (newClient: Client) => {
    if (!user || !userCompanyId) {
      toast.error("Utilizador não autenticado ou ID da empresa não encontrado.");
      return;
    }
    try {
      const companyId = userCompanyId;

      const clientDataToSave = {
        ...newClient,
        company_id: companyId,
        id: newClient.id || uuidv4(),
      };

      const { data, error } = await supabase
        .from('clients')
        .upsert(clientDataToSave)
        .select()
        .single();

      if (error) throw error;

      await fetchClients();
      form.setValue("client_id", data.id || null); // Alterado para null
      toast.success(`Cliente ${data.nome} registado com sucesso!`);
      setIsClientDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao registar cliente: ${error.message}`);
      console.error("Erro ao registar cliente:", error);
    }
  };

  const handleSaveProject = async (newProject: Project) => {
    if (!approvedBudgetId || !user || !userCompanyId) {
      toast.error("Nenhum orçamento aprovado para associar à obra ou ID da empresa não encontrado.");
      return;
    }
    try {
      const companyId = userCompanyId;
      if (!companyId) throw new Error("ID da empresa não encontrado no perfil do utilizador.");

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
          company_id: companyId,
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
      console.error("Erro ao criar obra:", error);
    }
  };

  const handleApproveBudget = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Por favor, corrija os erros no formulário antes de aprovar.");
      return;
    }

    setIsSaving(true);
    try {
      const companyId = userCompanyId;
      if (!companyId) throw new Error("ID da empresa não encontrado no perfil do utilizador.");

      const currentBudgetValues = form.getValues();
      
      const { data: updatedBudget, error: updateError } = await supabase
        .from('budgets')
        .update({
          estado: "Aprovado",
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentBudgetValues.id)
        .select()
        .single();

      if (updateError) throw updateError;

      form.setValue("estado", "Aprovado");
      setApprovedBudgetId(updatedBudget.id);
      toast.success("Orçamento aprovado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao aprovar orçamento: ${error.message}`);
      console.error("Erro ao aprovar orçamento:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const currentBudgetTotal = calculateCosts();
  const isApproved = form.watch("estado") === "Aprovado";

  const chapters = form.watch("chapters");
  const hasMissingChapterDetails = chapters.some(chapter => !chapter.codigo || !chapter.nome);
  const hasEmptyChapters = chapters.some(chapter => chapter.items.length === 0);
  const hasMissingServiceDetails = chapters.some(chapter =>
    chapter.items.some(item =>
      !item.servico || item.quantidade === 0 || item.preco_unitario === 0 || !item.unidade || !item.capitulo
    )
  );

  const allValidationsComplete =
    form.formState.isValid &&
    !hasMissingChapterDetails &&
    !hasEmptyChapters &&
    !hasMissingServiceDetails;

  return {
    form,
    onSubmit,
    handleApproveBudget,
    handleSaveClient,
    handleSaveProject,
    isSaving,
    approvedBudgetId,
    currentBudgetTotal,
    isApproved,
    allValidationsComplete,
    hasMissingChapterDetails,
    hasEmptyChapters,
    hasMissingServiceDetails,
    calculateCosts,
  };
}