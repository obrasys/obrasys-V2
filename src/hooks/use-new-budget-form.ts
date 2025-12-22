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
import { NewBudgetFormValues, newBudgetFormSchema, BudgetItem, BudgetWithRelations } from "@/schemas/budget-schema";
import { Client } from "@/schemas/client-schema";
import { Project } from "@/schemas/project-schema";

// Import new modular hooks
import { useBudgetCalculations } from "./use-budget-calculations";
import { useBudgetPersistence } from "./use-budget-persistence";
import { useClientProjectActions } from "./use-client-project-actions";

interface UseNewBudgetFormProps {
  userCompanyId: string | null;
  fetchClients: () => Promise<void>;
  setIsClientDialogOpen: (isOpen: boolean) => void;
  setIsProjectDialogOpen: (isOpen: boolean) => void;
  budgetIdToEdit?: string | null;
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
  budgetIdToEdit,
}: UseNewBudgetFormProps): UseNewBudgetFormResult {
  const navigate = useNavigate();
  const { user } = useSession();
  const [isSaving, setIsSaving] = React.useState(false);
  const [approvedBudgetId, setApprovedBudgetId] = React.useState<string | null>(null);
  const [isLoadingBudget, setIsLoadingBudget] = React.useState(!!budgetIdToEdit);

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
              custo_real_material: 0,
              custo_real_mao_obra: 0,
              desvio: 0,
              estado: "Planeado",
              article_id: null,
            },
          ],
        },
      ],
    },
  });

  // Use modular hooks
  const { currentBudgetTotal, totalExecuted, calculateCosts } = useBudgetCalculations({ form });
  const { saveBudget, approveBudget: persistApproveBudget } = useBudgetPersistence({ userCompanyId, user });
  const { handleSaveClient, handleSaveProject } = useClientProjectActions({
    userCompanyId,
    fetchClients,
    setIsClientDialogOpen,
    setIsProjectDialogOpen,
    approvedBudgetId,
    form,
  });

  // Effect to load existing budget if budgetIdToEdit is provided
  React.useEffect(() => {
    const fetchExistingBudget = async () => {
      if (!budgetIdToEdit || !userCompanyId) {
        setIsLoadingBudget(false);
        return;
      }
      setIsLoadingBudget(true);

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
        toast.error(`Erro ao carregar orçamento: ${budgetError.message}`);
        navigate("/budgeting");
        setIsLoadingBudget(false);
        return;
      }

      if (budgetData) {
        const transformedBudget: NewBudgetFormValues = {
          id: (budgetData as BudgetWithRelations).id,
          nome: (budgetData as BudgetWithRelations).nome,
          client_id: (budgetData as BudgetWithRelations).client_id,
          localizacao: (budgetData as BudgetWithRelations).localizacao || "",
          tipo_obra: (budgetData as BudgetWithRelations).tipo_obra || "Nova construção",
          data_orcamento: (budgetData as BudgetWithRelations).data_orcamento ? format(parseISO((budgetData as BudgetWithRelations).data_orcamento), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
          observacoes_gerais: (budgetData as BudgetWithRelations).observacoes_gerais || "",
          estado: (budgetData as BudgetWithRelations).estado,
          chapters: ((budgetData as BudgetWithRelations).budget_chapters || []).map(chapter => ({
            id: chapter.id,
            codigo: chapter.code || "",
            nome: chapter.title || "",
            observacoes: chapter.notes || "",
            items: (chapter.budget_items || []).map(item => ({
              id: item.id,
              capitulo_id: chapter.id,
              capitulo: item.capitulo,
              servico: item.servico,
              quantidade: item.quantidade,
              unidade: item.unidade,
              preco_unitario: item.preco_unitario,
              custo_planeado: item.custo_planeado,
              custo_executado: item.custo_executado,
              custo_real_material: item.custo_real_material || 0,
              custo_real_mao_obra: item.custo_real_mao_obra || 0,
              desvio: item.custo_executado - item.custo_planeado,
              estado: item.estado,
              article_id: item.article_id,
            })),
          })),
        };
        form.reset(transformedBudget);
        setApprovedBudgetId(transformedBudget.estado === "Aprovado" ? transformedBudget.id || null : null);
      }
      setIsLoadingBudget(false);
    };

    fetchExistingBudget();
  }, [budgetIdToEdit, userCompanyId, navigate, form]);

  const onSubmit = async (data: NewBudgetFormValues) => {
    setIsSaving(true);
    const savedBudgetId = await saveBudget(data, currentBudgetTotal, totalExecuted);
    if (savedBudgetId) {
      form.setValue('id', savedBudgetId); // Update form with new ID if it was a new budget
      navigate("/budgeting");
    }
    setIsSaving(false);
  };

  const handleApproveBudget = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Por favor, corrija os erros no formulário antes de aprovar.");
      return;
    }

    setIsSaving(true);
    const currentBudgetValues = form.getValues();
    const success = await persistApproveBudget(currentBudgetValues.id!, totalExecuted);
    if (success) {
      form.setValue("estado", "Aprovado");
      setApprovedBudgetId(currentBudgetValues.id!);
    }
    setIsSaving(false);
  };

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