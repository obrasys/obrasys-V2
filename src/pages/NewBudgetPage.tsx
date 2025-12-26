"use client";

import React from "react";
import { useNavigate, useParams } from "react-router-dom"; // Importar useParams

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";

import { ArrowLeft, PlusCircle } from "lucide-react";
import CreateEditClientDialog from "@/components/budgeting/create-edit-client-dialog";
import CreateEditProjectDialog from "@/components/projects/create-edit-project-dialog";

// Importar os novos componentes modulares
import BudgetGeneralInfo from "@/components/budgeting/BudgetGeneralInfo";
import BudgetChaptersSection from "@/components/budgeting/BudgetChaptersSection";
import BudgetFinancialSummary from "@/components/budgeting/BudgetFinancialSummary";
import BudgetValidations from "@/components/budgeting/BudgetValidations";
import BudgetApprovalSection from "@/components/budgeting/BudgetApprovalSection";

// Importar os novos hooks
import { useBudgetData } from "@/hooks/use-budget-data";
import { useNewBudgetForm } from "@/hooks/use-new-budget-form";
import { toast } from "sonner"; // Importar toast

const NewBudgetPage: React.FC = () => {
  const navigate = useNavigate();
  const { budgetId } = useParams<{ budgetId: string }>(); // Obter budgetId da URL
  const [isClientDialogOpen, setIsClientDialogOpen] = React.useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = React.useState(false);

  // Usar o hook para buscar dados
  const {
    userCompanyId,
    clients,
    articles,
    isLoadingData,
    fetchClients,
  } = useBudgetData();

  // Usar o hook para a lógica do formulário
  const {
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
  } = useNewBudgetForm({
    userCompanyId,
    fetchClients,
    setIsClientDialogOpen,
    setIsProjectDialogOpen,
    budgetIdToEdit: budgetId, // Passar o budgetId para o hook
  });

  // Calcular o total executado a partir dos valores do formulário
  const totalExecuted = form.watch("chapters").reduce((acc, chapter) => 
    acc + chapter.items.reduce((itemAcc, item) => itemAcc + ((item.custo_real_material || 0) + (item.custo_real_mao_obra || 0)), 0)
  , 0);

  if (isLoadingData) {
    // Poderíamos adicionar um skeleton loader aqui se a carga inicial for demorada
    return (
      <div className="flex items-center justify-center h-screen">
        <p>A carregar dados...</p>
      </div>
    );
  }

  const pageTitle = budgetId ? "Editar Orçamento" : "Novo Orçamento";
  const pageDescription = budgetId ? "Atualize os detalhes do orçamento existente" : "Crie e detalhe um novo orçamento para as suas obras";
  const saveButtonText = budgetId ? "Guardar Alterações" : "Guardar Rascunho";

  // Adicionar validação para garantir que há pelo menos um capítulo antes de aprovar
  const hasAtLeastOneChapter = form.watch("chapters")?.length > 0;
  const canApprove = allValidationsComplete && hasAtLeastOneChapter;

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">{pageTitle}</h1>
          <p className="text-muted-foreground text-sm">
            {pageDescription}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <Button variant="ghost" onClick={() => navigate("/budgeting")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Button type="submit" form="new-budget-form" disabled={isSaving || isApproved} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> {saveButtonText}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form id="new-budget-form" onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.error("Form validation errors:", errors);
          // Adicionado: Log específico para cada erro de validação
          Object.entries(errors).forEach(([field, error]) => {
            console.error(`Field: ${field}, Message: ${error?.message || JSON.stringify(error)}`);
            if (error?.type === 'array' && error.message) {
              toast.error(`Erro na lista de ${field}: ${error.message}`);
            } else if (error?.message) {
              toast.error(`Erro no campo ${field}: ${error.message}`);
            }
          });
          if (Object.keys(errors).length > 0) {
            toast.error("Por favor, corrija os erros no formulário antes de guardar.");
          }
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
            articles={articles}
            calculateCosts={calculateCosts}
            userCompanyId={userCompanyId}
          />

          {/* SEÇÃO C — Resumo Financeiro (auto) */}
          <BudgetFinancialSummary
            currentBudgetTotal={currentBudgetTotal}
            totalExecuted={totalExecuted} // NOVO: Passar o total executado
          />

          {/* SEÇÃO D — Validações Inteligentes (IA) */}
          <BudgetValidations
            form={form}
            allValidationsComplete={allValidationsComplete}
            hasEmptyServices={hasMissingServiceDetails}
            hasEmptyChapters={hasEmptyChapters || hasMissingChapterDetails}
            hasMissingChapterDetails={hasMissingChapterDetails}
            hasMissingServiceDetails={hasMissingServiceDetails}
          />

          {/* SEÇÃO E — Aprovação */}
          <BudgetApprovalSection
            isApproved={isApproved}
            handleApproveBudget={handleApproveBudget}
            isSaving={isSaving}
            allValidationsComplete={canApprove} // Usar a nova variável canApprove
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