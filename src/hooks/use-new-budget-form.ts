"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { NewBudgetFormValues, newBudgetFormSchema, BudgetItem, BudgetWithRelations } from "@/schemas/budget-schema"; // Import BudgetWithRelations
import { Client } from "@/schemas/client-schema";
import { Project } from "@/schemas/project-schema";

interface UseNewBudgetFormProps {
  userCompanyId: string | null;
  fetchClients: () => Promise<void>;
  setIsClientDialogOpen: (isOpen: boolean) => void;
  setIsProjectDialogOpen: (isOpen: boolean) => void;
  budgetIdToEdit?: string | null; // NOVO: ID do orçamento a editar
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
  budgetIdToEdit, // Receber budgetIdToEdit
}: UseNewBudgetFormProps): UseNewBudgetFormResult {
  const navigate = useNavigate();
  const { user } = useSession();
  const [isSaving, setIsSaving] = React.useState(false);
  const [approvedBudgetId, setApprovedBudgetId] = React.useState<string | null>(null);
  const [isLoadingBudget, setIsLoadingBudget] = React.useState(!!budgetIdToEdit); // Novo estado para carregar orçamento

  const form = useForm<NewBudgetFormValues>({
    resolver: zodResolver(newBudgetFormSchema),
    defaultValues: {
      nome: "",
      client_id: null,
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
              capitulo_id: null,
              capitulo: "Fundações",
              servico: "Escavação manual em vala",
              quantidade: 1,
              unidade: "m³",
              preco_unitario: 0.01,
              custo_planeado: 0,
              custo_executado: 0,
              custo_real_material: 0, // NOVO
              custo_real_mao_obra: 0, // NOVO
              desvio: 0,
              estado: "Planeado",
              article_id: null,
            },
          ],
        },
      ],
    },
  });

  // Efeito para carregar o orçamento se budgetIdToEdit for fornecido
  React.useEffect(() => {
    const fetchExistingBudget = async () => {
      if (!budgetIdToEdit || !userCompanyId) {
        setIsLoadingBudget(false);
        console.log("[useNewBudgetForm] No budgetIdToEdit or userCompanyId. Not fetching existing budget.");
        return;
      }
      setIsLoadingBudget(true);
      console.log(`[useNewBudgetForm] Fetching budget for ID: ${budgetIdToEdit}`);

      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select(`
          id, company_id, project_id, nome, client_id, localizacao, tipo_obra, data_orcamento, observacoes_gerais, total_planeado, total_executado, estado, created_at, updated_at,
          clients(nome),
          budget_chapters (
            id,
            title,
            code,
            notes,
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
        .eq('id', budgetIdToEdit)
        .eq('company_id', userCompanyId)
        .single();

      if (budgetError) {
        console.error("[useNewBudgetForm] Erro ao carregar orçamento existente:", budgetError);
        toast.error(`Erro ao carregar orçamento: ${budgetError.message}`);
        navigate("/budgeting"); // Redirecionar se o orçamento não for encontrado ou houver erro
        setIsLoadingBudget(false);
        return;
      }

      if (budgetData) {
        console.log("[useNewBudgetForm] Loaded budget data from DB:", budgetData);
        // Cast budgetData to BudgetWithRelations
        const transformedBudget: NewBudgetFormValues = {
          id: (budgetData as BudgetWithRelations).id,
          nome: (budgetData as BudgetWithRelations).nome,
          client_id: (budgetData as BudgetWithRelations).client_id,
          localizacao: (budgetData as BudgetWithRelations).localizacao || "",
          tipo_obra: (budgetData as BudgetWithRelations).tipo_obra || "Nova construção", // Mapear tipo_obra
          data_orcamento: (budgetData as BudgetWithRelations).data_orcamento ? format(parseISO((budgetData as BudgetWithRelations).data_orcamento), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"), // Mapear data_orcamento
          observacoes_gerais: (budgetData as BudgetWithRelations).observacoes_gerais || "", // Mapear observacoes_gerais
          estado: (budgetData as BudgetWithRelations).estado,
          chapters: ((budgetData as BudgetWithRelations).budget_chapters || []).map(chapter => ({
            id: chapter.id,
            codigo: chapter.code || "",
            nome: chapter.title || "",
            observacoes: chapter.notes || "",
            items: (chapter.budget_items || []).map(item => ({
              id: item.id,
              capitulo_id: chapter.id, // Link item to its chapter
              capitulo: item.capitulo,
              servico: item.servico,
              quantidade: item.quantidade,
              unidade: item.unidade,
              preco_unitario: item.preco_unitario,
              custo_planeado: item.custo_planeado,
              custo_executado: item.custo_executado,
              custo_real_material: item.custo_real_material || 0, // NOVO
              custo_real_mao_obra: item.custo_real_mao_obra || 0, // NOVO
              desvio: item.custo_executado - item.custo_planeado,
              estado: item.estado,
              article_id: item.article_id,
            })),
          })),
        };
        console.log("[useNewBudgetForm] Transformed budget for form.reset():", transformedBudget);
        form.reset(transformedBudget);
        setApprovedBudgetId(transformedBudget.estado === "Aprovado" ? transformedBudget.id || null : null);
      }
      setIsLoadingBudget(false);
    };

    fetchExistingBudget();
  }, [budgetIdToEdit, userCompanyId, navigate, form]);


  const calculateCosts = React.useCallback(() => {
    const currentChapters = form.getValues("chapters");
    let totalPlanned = 0;
    let totalExecuted = 0; // NOVO: Para o total executado do orçamento

    currentChapters.forEach((chapter, chapterIndex) => {
      chapter.items.forEach((item, itemIndex) => {
        const plannedCost = item.quantidade * item.preco_unitario;
        const executedCostItem = (item.custo_real_material || 0) + (item.custo_real_mao_obra || 0); // NOVO: Soma dos custos reais, com fallback para 0
        const deviation = executedCostItem - plannedCost; // NOVO: Desvio por item

        // Atualiza os valores no formulário se houver alteração
        if (form.getValues(`chapters.${chapterIndex}.items.${itemIndex}.custo_planeado`) !== plannedCost) {
          form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.custo_planeado`, plannedCost);
        }
        if (form.getValues(`chapters.${chapterIndex}.items.${itemIndex}.custo_executado`) !== executedCostItem) {
          form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.custo_executado`, executedCostItem);
        }
        if (form.getValues(`chapters.${chapterIndex}.items.${itemIndex}.desvio`) !== deviation) {
          form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.desvio`, deviation);
        }
        
        totalPlanned += plannedCost;
        totalExecuted += executedCostItem; // NOVO: Acumula o custo executado total
      });
    });
    // Retorna o total planeado, o total executado será usado no BudgetFinancialSummary
    return totalPlanned;
  }, [form]);

  React.useEffect(() => {
    calculateCosts();
  }, [calculateCosts]);

  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name?.includes("quantidade") || name?.includes("preco_unitario") || name?.includes("custo_real_material") || name?.includes("custo_real_mao_obra")) {
        calculateCosts();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, calculateCosts]);

  const onSubmit = async (data: NewBudgetFormValues) => {
    console.log("--- onSubmit: Starting budget save process ---");
    console.log("Current form data (including ID):", data);
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
      console.log("onSubmit: Using companyId:", companyId);

      const initialTotalPlanned = calculateCosts(); 
      // Recalcular o total executado para o orçamento principal
      const totalExecutedForBudget = data.chapters.reduce((acc, chapter) => 
        acc + chapter.items.reduce((itemAcc, item) => itemAcc + ((item.custo_real_material || 0) + (item.custo_real_mao_obra || 0)), 0) // Ensure null/undefined handling
      , 0);
      console.log("onSubmit: Calculated total executed cost for budget:", totalExecutedForBudget);


      let currentBudgetId = data.id;

      if (currentBudgetId) {
        // EDITING EXISTING BUDGET
        console.log(`onSubmit: Attempting to update existing budget record with ID: ${currentBudgetId}`);
        const budgetPayload = {
          nome: data.nome,
          client_id: data.client_id,
          localizacao: data.localizacao,
          tipo_obra: data.tipo_obra, // Incluir tipo_obra
          data_orcamento: data.data_orcamento, // Incluir data_orcamento
          observacoes_gerais: data.observacoes_gerais, // Incluir observacoes_gerais
          total_planeado: initialTotalPlanned,
          total_executado: totalExecutedForBudget, // NOVO: Atualizar total_executado
          estado: data.estado,
          updated_at: new Date().toISOString(),
        };
        console.log("onSubmit: Budget update payload:", budgetPayload);

        const { error: budgetUpdateError } = await supabase
          .from('budgets')
          .update(budgetPayload)
          .eq('id', currentBudgetId);

        if (budgetUpdateError) {
          console.error("onSubmit: Supabase budget update error:", budgetUpdateError);
          throw new Error(`Erro ao atualizar orçamento principal: ${budgetUpdateError.message}`);
        }
        console.log("onSubmit: Main budget record updated successfully.");

        // Delete existing chapters and items for this budget
        console.log(`onSubmit: Deleting existing budget items for budget ID: ${currentBudgetId}`);
        const { error: deleteItemsError } = await supabase
          .from('budget_items')
          .delete()
          .eq('budget_id', currentBudgetId);
        if (deleteItemsError) {
          console.warn("onSubmit: Erro ao eliminar itens antigos do orçamento:", deleteItemsError);
          // Don't throw, just warn, as chapters might still be linked
        }

        console.log(`onSubmit: Deleting existing budget chapters for budget ID: ${currentBudgetId}`);
        const { error: deleteChaptersError } = await supabase
          .from('budget_chapters')
          .delete()
          .eq('budget_id', currentBudgetId);
        if (deleteChaptersError) {
          console.error("onSubmit: Erro ao eliminar capítulos antigos do orçamento:", deleteChaptersError);
          throw new Error(`Erro ao eliminar capítulos antigos: ${deleteChaptersError.message}`);
        }
        console.log("onSubmit: Existing chapters and items deleted successfully.");

      } else {
        // CREATING NEW BUDGET
        console.log("onSubmit: Attempting to insert new main budget record.");
        const budgetPayload = {
          company_id: companyId,
          nome: data.nome,
          client_id: data.client_id,
          localizacao: data.localizacao,
          tipo_obra: data.tipo_obra, // Incluir tipo_obra
          data_orcamento: data.data_orcamento, // Incluir data_orcamento
          observacoes_gerais: data.observacoes_gerais, // Incluir observacoes_gerais
          project_id: null,
          total_planeado: initialTotalPlanned,
          total_executado: totalExecutedForBudget, // NOVO: Incluir total_executado
          estado: data.estado,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.log("onSubmit: New budget payload:", budgetPayload);

        const { data: newBudgetData, error: budgetError } = await supabase
          .from('budgets')
          .insert(budgetPayload)
          .select()
          .single();

        if (budgetError) {
          console.error("onSubmit: Supabase new budget insertion error:", budgetError);
          throw new Error(`Erro ao criar orçamento principal: ${budgetError.message}`);
        }
        currentBudgetId = newBudgetData.id;
        form.setValue('id', newBudgetData.id); // Update form with new ID
        console.log("onSubmit: New main budget record inserted successfully:", newBudgetData);
      }

      // Insert all chapters and their items (for both new and updated budgets)
      for (const chapter of data.chapters) {
        console.log(`onSubmit: Attempting to insert budget chapter: ${chapter.nome}`);
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
          budget_id: currentBudgetId,
          chapter_id: chapterData.id, // Link to the newly created chapter
          capitulo: item.capitulo,
          servico: item.servico,
          quantidade: item.quantidade,
          unidade: item.unidade,
          preco_unitario: item.preco_unitario,
          custo_planeado: item.custo_planeado,
          custo_executado: item.custo_executado, // NOVO: Incluir custo_executado
          custo_real_material: item.custo_real_material, // NOVO
          custo_real_mao_obra: item.custo_real_mao_obra, // NOVO
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

      toast.success(`Orçamento ${data.id ? "atualizado" : "criado"} com sucesso!`);
      navigate("/budgeting");
    } catch (error: any) {
      toast.error(`Erro ao guardar orçamento: ${error.message}`);
      console.error("onSubmit: Caught error during budget operation:", error);
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
      form.setValue("client_id", data.id || null);
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
      
      // Recalcular o total executado para o orçamento principal antes de aprovar
      const totalExecutedForBudget = currentBudgetValues.chapters.reduce((acc, chapter) => 
        acc + chapter.items.reduce((itemAcc, item) => itemAcc + ((item.custo_real_material || 0) + (item.custo_real_mao_obra || 0)), 0) // Ensure null/undefined handling
      , 0);

      const { data: updatedBudget, error: updateError } = await supabase
        .from('budgets')
        .update({
          estado: "Aprovado",
          total_executado: totalExecutedForBudget, // NOVO: Atualizar total_executado ao aprovar
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