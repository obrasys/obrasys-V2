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
  const [isClientDialogOpen, setIsClientDialogOpen] = React.useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);
  const [approvedBudgetId, setApprovedBudgetId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

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
              servico: "Escavação manual em vala",
              quantidade: 50,
              unidade: "m³",
              preco_unitario: 15.00,
              custo_planeado: 750.00,
              custo_executado: 0,
              desvio: 0,
              estado: "Planeado",
            },
          ],
        },
      ],
    },
  });

  // Fetch clients on component mount
  React.useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase.from('clients').select('id, nome');
      if (error) {
        toast.error(`Erro ao carregar clientes: ${error.message}`);
        console.error("Erro ao carregar clientes:", error);
      } else {
        setClients(data || []);
      }
    };
    fetchClients();
  }, []);

  // Calculate custo_planeado for each item and total budget
  const calculateCosts = React.useCallback(() => {
    const currentChapters = form.getValues("chapters");
    let totalPlanned = 0;

    currentChapters.forEach((chapter, chapterIndex) => {
      chapter.items.forEach((item, itemIndex) => {
        const plannedCost = item.quantidade * item.preco_unitario;
        form.setValue(`chapters.${chapterIndex}.items.${itemIndex}.custo_planeado`, plannedCost);
        totalPlanned += plannedCost;
      });
    });
    return totalPlanned;
  }, [form]);

  // Watch for changes in quantities and prices to recalculate costs
  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name?.includes("quantidade") || name?.includes("preco_unitario")) {
        calculateCosts();
      }
    });
    calculateCosts(); // Initial calculation
    return () => subscription.unsubscribe();
  }, [form, calculateCosts]);

  const onSubmit = async (data: NewBudgetFormValues) => {
    if (!user) {
      toast.error("Utilizador não autenticado.");
      return;
    }
    setIsSaving(true);

    try {
      const companyId = user.user_metadata.company_id;
      if (!companyId) throw new Error("ID da empresa não encontrado no perfil do utilizador.");

      const totalPlanned = calculateCosts();

      // 1. Insert the main budget record
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          company_id: companyId,
          nome: data.nome,
          project_id: null, // Project is linked later
          total_planeado: totalPlanned,
          total_executado: 0,
          estado: data.estado,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (budgetError) throw budgetError;

      // 2. Insert budget items for each chapter
      const budgetItemsToInsert = data.chapters.flatMap((chapter) =>
        chapter.items.map((item) => ({
          company_id: companyId,
          budget_id: budgetData.id,
          capitulo: chapter.nome, // Use chapter name as capitulo
          servico: item.servico,
          quantidade: item.quantidade,
          unidade: item.unidade,
          preco_unitario: item.preco_unitario,
          custo_planeado: item.custo_planeado,
          custo_executado: 0,
          estado: item.estado,
          observacoes: "", // Add observacoes if needed in schema
        })),
      );

      const { error: itemsError } = await supabase
        .from('budget_items')
        .insert(budgetItemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Orçamento criado com sucesso!");
      navigate("/budgeting"); // Redirect to budgeting page
    } catch (error: any) {
      toast.error(`Erro ao criar orçamento: ${error.message}`);
      console.error("Erro ao criar orçamento:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClient = (newClient: Client) => {
    setClients((prevClients) => {
      if (newClient.id && prevClients.some((c) => c.id === newClient.id)) {
        return prevClients.map((c) => (c.id === newClient.id ? newClient : c));
      }
      return [...prevClients, newClient];
    });
    form.setValue("client_id", newClient.id || ""); // Select the newly created client
    toast.success(`Cliente ${newClient.nome} registado com sucesso!`);
  };

  const handleSaveProject = async (newProject: Project) => {
    if (!approvedBudgetId) {
      toast.error("Nenhum orçamento aprovado para associar à obra.");
      return;
    }
    try {
      const companyId = user?.user_metadata.company_id;
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
    if (!form.formState.isValid) {
      toast.error("Por favor, corrija os erros no formulário antes de aprovar.");
      form.trigger(); // Trigger all validations to show errors
      return;
    }

    setIsSaving(true);
    try {
      const companyId = user?.user_metadata.company_id;
      if (!companyId) throw new Error("ID da empresa não encontrado no perfil do utilizador.");

      const currentBudgetValues = form.getValues();
      const totalPlanned = calculateCosts();

      // Update the budget status to 'Aprovado' in the database
      const { data: updatedBudget, error: updateError } = await supabase
        .from('budgets')
        .update({
          estado: "Aprovado",
          total_planeado: totalPlanned,
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

  // Basic validations for AI section
  const hasEmptyServices = form.watch("chapters").some(chapter =>
    chapter.items.some(item => !item.servico || item.quantidade === 0 || item.preco_unitario === 0)
  );
  const hasEmptyChapters = form.watch("chapters").some(chapter => chapter.items.length === 0);
  const allValidationsComplete = form.formState.isValid && !hasEmptyServices && !hasEmptyChapters;

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
        <form id="new-budget-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            hasEmptyServices={hasEmptyServices}
            hasEmptyChapters={hasEmptyChapters}
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