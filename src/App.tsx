import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionContextProvider } from "@/components/SessionContextProvider";
import MainLayout from "@/components/MainLayout";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import ProfilePage from "@/pages/ProfilePage";
import Budgeting from "@/pages/Budgeting";
import NewBudgetPage from "@/pages/NewBudgetPage";
import ProjectManagement from "@/pages/ProjectManagement";
import SupplyChain from "@/pages/SupplyChain";
import CRMPortal from "@/pages/CRMPortal";
import AutomationIntelligence from "@/pages/AutomationIntelligence";
import CompliancePage from "@/pages/CompliancePage";
import LivroDeObraPage from "@/pages/LivroDeObraPage";
import ComplianceChecklistPage from "@/pages/ComplianceChecklistPage";
import AIAssistantAlertsPage from "@/pages/AIAssistantAlertsPage";
import ReplanningSuggestionsPage from "@/pages/ReplanningSuggestionsPage";
import AIAssistantPage from "@/pages/AIAssistantPage";
import PerformanceAnalysisPage from "@/pages/PerformanceAnalysisPage";
import ProjectsPage from "@/pages/ProjectsPage";
import AccountsPage from "@/pages/AccountsPage";
import PayrollIntegrationPage from "@/pages/PayrollIntegrationPage";
import FinancialDashboardsPage from "@/pages/FinancialDashboardsPage";
import WorkItemsPage from "@/pages/WorkItemsPage";
import PriceDatabasePage from "@/pages/PriceDatabasePage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import CollaboratorsPage from "@/pages/CollaboratorsPage";
import ReportsPage from "@/pages/ReportsPage";
import SchedulePage from "@/pages/SchedulePage";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip"; // Import TooltipProvider

const App = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SessionContextProvider>
        <Toaster richColors position="top-right" />
        <TooltipProvider> {/* Adicionado TooltipProvider aqui */}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Index />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="budgeting" element={<Budgeting />} />
              <Route path="budgeting/new" element={<NewBudgetPage />} />
              <Route path="budgeting/edit/:budgetId" element={<NewBudgetPage />} />
              <Route path="project-management" element={<ProjectManagement />} />
              <Route path="supply-chain" element={<SupplyChain />} />
              <Route path="crm-portal" element={<CRMPortal />} />
              <Route path="automation-intelligence" element={<AutomationIntelligence />} />
              <Route path="automation-intelligence/ai-alerts" element={<AIAssistantAlertsPage />} />
              <Route path="automation-intelligence/replanning-suggestions" element={<ReplanningSuggestionsPage />} />
              <Route path="automation-intelligence/ai-assistant" element={<AIAssistantPage />} />
              <Route path="automation-intelligence/performance-analysis" element={<PerformanceAnalysisPage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="compliance/livro-de-obra" element={<LivroDeObraPage />} />
              <Route path="compliance/checklist" element={<ComplianceChecklistPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="finance-management" element={<FinancialDashboardsPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="finance-management/payroll-integration" element={<PayrollIntegrationPage />} />
              <Route path="finance-management/dashboards" element={<FinancialDashboardsPage />} />
              <Route path="work-items" element={<WorkItemsPage />} />
              <Route path="price-database" element={<PriceDatabasePage />} />
              <Route path="approvals" element={<ApprovalsPage />} />
              <Route path="collaborators" element={<CollaboratorsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </TooltipProvider>
      </SessionContextProvider>
    </BrowserRouter>
  );
};

export default App;
</dyad-file>

<dyad-write path="src/hooks/use-new-budget-form.ts" description="Ajustar valores padrão de campos opcionais para string vazia para evitar avisos de campos controlados.">
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
      client_id: null, // Alterado para null
      localizacao: "",
      tipo_obra: "Nova construção",
      data_orcamento: format(new Date(), "yyyy-MM-dd"),
      observacoes_gerais: "", // Alterado de null para ""
      estado: "Rascunho",
      chapters: [
        {
          id: uuidv4(),
          codigo: "01",
          nome: "Fundações",
          observacoes: "", // Alterado de null para ""
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
          id: budgetData.id,
          nome: budgetData.nome,
          client_id: budgetData.client_id,
          localizacao: budgetData.localizacao || "",
          tipo_obra: budgetData.tipo_obra || "Nova construção",
          data_orcamento: budgetData.data_orcamento ? format(parseISO(budgetData.data_orcamento), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
          observacoes_gerais: budgetData.observacoes_gerais || "", // Alterado de null para ""
          estado: budgetData.estado,
          chapters: (budgetData.budget_chapters || []).map((chapter: any) => ({
            id: chapter.id,
            codigo: chapter.code || "",
            nome: chapter.title || "",
            observacoes: chapter.notes || "", // Alterado de null para ""
            items: (chapter.budget_items || []).map((item: any) => ({
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