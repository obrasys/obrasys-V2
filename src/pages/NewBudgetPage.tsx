"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { ArrowLeft, PlusCircle } from "lucide-react";
import { NewBudgetFormValues, newBudgetFormSchema, BudgetItem } from "@/schemas/budget-schema";
import { Client } from "@/schemas/client-schema";
import { Article } from "@/schemas/article-schema"; // Import Article type
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CreateEditClientDialog from "@/components/budgeting/create-edit-client-dialog";
import CreateEditProjectDialog from "@/components/projects/create-edit-project-dialog";
import { Project } from "@/schemas/project-schema";
import { useSession } from "@/components/SessionContextProvider";

// Importar os novos componentes modulares
import BudgetGeneralInfo from "@/components/budgeting/BudgetGeneralInfo";
import BudgetChaptersSection from "@/components/budgeting/BudgetChaptersSection";
import BudgetFinancialSummary from "@/components/budgeting/BudgetFinancialSummary";
import BudgetValidations from "@/components/budgeting/BudgetValidations";
import BudgetApprovalSection from "@/components/budgeting/BudgetApprovalSection";

const NewBudgetPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const [clients, setClients] = React.useState<Client[]>([]);
  const [articles, setArticles] = React.useState<Article[]>([]); // NOVO: Estado para armazenar artigos
  const [isClientDialogOpen, setIsClientDialogOpen] = React.useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);
  const [approvedBudgetId, setApprovedBudgetId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [userCompanyId, setUserCompanyId] = React.useState<string | null>(null);

  const form = useForm<NewBudgetFormValues>({
    resolver: zodResolver(newBudgetFormSchema),
    defaultValues: {
      nome: "",
      client_id: "",
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
              capitulo_id: "", // Will be set dynamically
              capitulo: "Fundações", // Adicionado para corresponder ao esquema
              servico: "Escavação manual em vala",
              quantidade: 1,
              unidade: "m³",
              preco_unitario: 0,
              custo_planeado: 0,
              custo_executado: 0,
              desvio: 0,
              estado: "Planeado",
              article_id: null, // NOVO: Default para null
            },
          ],
        },
      ],
    },
  });

  // Função para buscar o company_id do perfil do utilizador
  const fetchUserCompanyId = React.useCallback(async () => {
    console.log("fetchUserCompanyId: Attempting to fetch user company ID.");
    if (!user) {
      setUserCompanyId(null);
      console.log("fetchUserCompanyId: User not authenticated, userCompanyId set to null.");
      return;
    }
    console.log("fetchUserCompanyId: User is authenticated, fetching profile for user ID:", user.id);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("fetchUserCompanyId: Erro ao carregar company_id do perfil:", profileError);
      setUserCompanyId(null);
    } else if (profileData) {
      setUserCompanyId(profileData.company_id);
    }
  }, [user]);

  // Buscar o company_id do utilizador ao montar o componente e quando o utilizador muda
  React.useEffect(() => {
    fetchUserCompanyId();
  }, [fetchUserCompanyId]);

  // Função para buscar clientes (agora depende de userCompanyId)
  const fetchClients = React.useCallback(async () => {
    if (!userCompanyId) { // Só busca clientes se o companyId estiver disponível
      setClients([]);
      console.log("NewBudgetPage: userCompanyId is null, clients set to empty array.");
      return;
    }
    const { data, error } = await supabase.from('clients').select('id, nome').eq('company_id', userCompanyId); // Filtra por company_id
    if (error) {
      toast.error(`Erro ao carregar clientes: ${error.message}`);
      console.error("NewBudgetPage: Erro ao carregar clientes:", error);
    } else {
      setClients(data || []);
      console.log("NewBudgetPage: Clients fetched for company_id", userCompanyId, ":", data);
    }
  }, [userCompanyId]); // Agora depende de userCompanyId

  // NOVO: Função para buscar artigos (depende de userCompanyId)
  const fetchArticles = React.useCallback(async () => {
    if (!userCompanyId) {
      setArticles([]);
      console.log("NewBudgetPage: userCompanyId is null, articles set to empty array.");
      return;
    }
    const { data, error } = await supabase.from('articles').select('*').eq('company_id', userCompanyId);
    if (error) {
      toast.error(`Erro ao carregar artigos: ${error.message}`);
      console.error("NewBudgetPage: Erro ao carregar artigos:", error);
    } else {
      setArticles(data || []);
      console.log("NewBudgetPage: Articles fetched for company_id", userCompanyId, ":", data);
    }
  }, [userCompanyId]);

  // Buscar clientes e artigos ao montar o componente e quando userCompanyId muda
  React.useEffect(() => {
    fetchClients();
    fetchArticles(); // NOVO: Chamar fetchArticles
  }, [fetchClients, fetchArticles]);

  // Calculate custo_planeado for each item and total budget
  const calculateCosts = React.useCallback(() => {
    const currentChapters = form.getValues("chapters");
    let totalPlanned = 0;

    currentChapters.forEach((chapter, chapterIndex) => {
      chapter.items.forEach((item, itemIndex) => {
        const plannedCost = item.quantidade * item.preco_unitario;
        // Only update if the value is different to avoid unnecessary re-renders
        if (form.getValues(`chapters.${chapterIndex}.items.${itemIndex}.custo_planeado`) !== plannedCost) {
          form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.custo_planeado`, plannedCost);
        }
        totalPlanned += plannedCost;
      });
    });
    return totalPlanned;
  }, [form]);

  // Initial calculation on mount
  React.useEffect(() => {
    calculateCosts();
  }, [calculateCosts]);

  // Watch for changes in quantities and prices to recalculate costs
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name?.includes("quantidade") || name?.includes("preco_unitario")) {
        calculateCosts();
      }
    });
    return () => subscription.unsubscribe();
  }, [form, calculateCosts]);

  const onSubmit = async (data: NewBudgetFormValues) => {
    console.log("onSubmit: Starting budget save process.");
    console.log("onSubmit: Current user:", user);
    console.log("onSubmit: Current userCompanyId:", userCompanyId);

    if (!user || !userCompanyId) {
      toast.error("Utilizador não autenticado ou ID da empresa não encontrado. Por favor, faça login novamente.");
      console.error("onSubmit: Aborting save - user or userCompanyId is missing.");
      return;
    }
    setIsSaving(true);
    console.log("onSubmit: isSaving set to true.");

    try {
      const companyId = userCompanyId;
      if (!companyId) {
        throw new Error("ID da empresa não encontrado no perfil do utilizador.");
      }
      console.log("onSubmit: Using companyId:", companyId);

      // The total_planeado will be calculated by the database triggers
      // We can send a placeholder or the current calculated value, but the trigger will override it.
      const initialTotalPlanned = calculateCosts(); 

      // 1. Insert the main budget record
      console.log("onSubmit: Attempting to insert main budget record.");
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          company_id: companyId,
          nome: data.nome,
          client_id: data.client_id, // Adicionado client_id
          project_id: null, // Project ID is set later when creating a project
          total_planeado: initialTotalPlanned, // Will be updated by trigger
          total_executado: 0,
          estado: data.estado,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (budgetError) {
        console.error("onSubmit: Supabase budget insertion error:", budgetError);
        throw budgetError;
      }
      console.log("onSubmit: Main budget record inserted successfully:", budgetData);

      // 2. Insert budget chapters and their items
      for (const chapter of data.chapters) {
        console.log(`onSubmit: Attempting to insert budget chapter: ${chapter.nome}`);
        const { data: chapterData, error: chapterError } = await supabase
          .from('budget_chapters')
          .insert({
            budget_id: budgetData.id,
            title: chapter.nome,
            code: chapter.codigo,
            sort_order: 0, // Placeholder, could be chapterIndex
            notes: chapter.observacoes,
            subtotal: 0, // Will be updated by trigger
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (chapterError) {
          console.error("onSubmit: Supabase budget chapter insertion error:", chapterError);
          throw chapterError;
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
          custo_planeado: item.custo_planeado, // Will be updated by trigger
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
          throw itemsError;
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
      console.log("onSubmit: isSaving set to false in finally block.");
    }
  };

  const handleSaveClient = async (newClient: Client) => {
    if (!user || !userCompanyId) { // Verificar userCompanyId
      toast.error("Utilizador não autenticado ou ID da empresa não encontrado.");
      return;
    }
    try {
      const companyId = userCompanyId; // Usar o companyId obtido

      const clientDataToSave = {
        ...newClient,
        company_id: companyId, // Usar o companyId obtido
        id: newClient.id || uuidv4(), // Ensure ID exists for upsert
      };

      const { data, error } = await supabase
        .from('clients')
        .upsert(clientDataToSave)
        .select()
        .single();

      if (error) throw error;

      await fetchClients(); // Recarregar clientes
      form.setValue("client_id", data.id || "");
      toast.success(`Cliente ${data.nome} registado com sucesso!`);
      setIsClientDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao registar cliente: ${error.message}`);
      console.error("Erro ao registar cliente:", error);
    }
  };

  const handleSaveProject = async (newProject: Project) => {
    if (!approvedBudgetId || !user || !userCompanyId) { // Verificar userCompanyId
      toast.error("Nenhum orçamento aprovado para associar à obra ou ID da empresa não encontrado.");
      return;
    }
    try {
      const companyId = userCompanyId; // Usar o companyId obtido
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
          company_id: companyId, // Usar o companyId obtido
        })
        .select()
        .single();

      if (error) throw error;

      // Update the budget in DB to link the project
      const { error: updateBudgetError } = await supabase
        .from('budgets')
        .update({ project_id: data.id })
        .eq('id', approvedBudgetId);

      if (updateBudgetError) throw updateBudgetError;

      toast.success(`Obra "${newProject.nome}" criada e ligada ao orçamento!`);
      setIsProjectDialogOpen(false);
      navigate(`/projects`); // Navigate to projects page
    } catch (error: any) {
      toast.error(`Erro ao criar obra: ${error.message}`);
      console.error("Erro ao criar obra:", error);
    }
  };

  const handleApproveBudget = async () => {
    // Trigger form validation explicitly before approving
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Por favor, corrija os erros no formulário antes de aprovar.");
      console.error("Form validation errors on approve:", form.formState.errors);
      return;
    }

    setIsSaving(true);
    try {
      const companyId = userCompanyId; // Usar o companyId obtido
      if (!companyId) throw new Error("ID da empresa não encontrado no perfil do utilizador.");

      const currentBudgetValues = form.getValues();
      
      // Update the budget status to 'Aprovado' in the database
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
      setApprovedBudgetId(updatedBudget.id); // Store the ID of the approved budget
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

  // Validações para a seção de IA
  const chapters = form.watch("chapters");

  const hasMissingChapterDetails = chapters.some(chapter => !chapter.codigo || !chapter.nome);
  const hasEmptyChapters = chapters.some(chapter => chapter.items.length === 0);
  const hasMissingServiceDetails = chapters.some(chapter =>
    chapter.items.some(item =>
      !item.servico || item.quantidade === 0 || item.preco_unitario === 0 || !item.unidade || !item.capitulo
    )
  );

  // A validação geral do formulário (form.formState.isValid) já deve cobrir a maioria dos campos
  // Mas adicionamos as verificações explícitas para a UI de validações inteligentes
  const allValidationsComplete =
    form.formState.isValid &&
    !hasMissingChapterDetails &&
    !hasEmptyChapters &&
    !hasMissingServiceDetails;

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">Novo Orçamento</h1>
          <p className="text-muted-foreground text-sm">
            Crie e detalhe um novo orçamento para as suas obras
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Button variant="ghost" onClick={() => navigate("/budgeting")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button type="submit" form="new-budget-form" disabled={isSaving || isApproved} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Guardar Rascunho
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form id="new-budget-form" onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error("Form validation errors:", errors);
          toast.error("Por favor, corrija os erros no formulário antes de guardar.");
        })} className="space-y-6">
          {/* SEÇÃO A — Dados Gerais do Orçamento */}
          <BudgetGeneralInfo
            form={form}
            isApproved={isApproved}
            clients={clients}
            setIsClientDialogOpen={setIsClientDialogOpen}
          />

          {/* SEÇÃO B — Capítulos do Orçamento (NÚCLEO) */}
          <BudgetChaptersSection
            form={form}
            isApproved={isApproved}
            articles={articles} // NOVO: Passar artigos para o componente
            calculateCosts={calculateCosts}
          />

          {/* SEÇÃO C — Resumo Financeiro (auto) */}
          <BudgetFinancialSummary
            currentBudgetTotal={currentBudgetTotal}
          />

          {/* SEÇÃO D — Validações Inteligentes (IA) */}
          <BudgetValidations
            form={form}
            allValidationsComplete={allValidationsComplete}
            hasEmptyServices={hasMissingServiceDetails} // Usar a nova validação
            hasEmptyChapters={hasEmptyChapters || hasMissingChapterDetails} // Combinar as validações de capítulo
            hasMissingChapterDetails={hasMissingChapterDetails} // Passar a nova validação
            hasMissingServiceDetails={hasMissingServiceDetails} // Passar a nova validação
          />

          {/* SEÇÃO E — Aprovação */}
          <BudgetApprovalSection
            isApproved={isApproved}
            handleApproveBudget={handleApproveBudget}
            isSaving={isSaving}
            allValidationsComplete={allValidationsComplete}
            approvedBudgetId={approvedBudgetId}
            setIsProjectDialogOpen={setIsProjectDialogOpen}
          />
        </form>
      </Form>

      <CreateEditClientDialog
        isOpen={isClientDialogOpen}
        onClose={() => setIsClientDialogOpen(false)}
        onSave={handleSaveClient}
        clientToEdit={null}
      />

      {approvedBudgetId && (
        <CreateEditProjectDialog
          isOpen={isProjectDialogOpen}
          onClose={() => setIsProjectDialogOpen(false)}
          onSave={handleSaveProject}
          projectToEdit={null}
          initialBudgetId={approvedBudgetId}
        />
      )}
    </div>
  );
};

export default NewBudgetPage;