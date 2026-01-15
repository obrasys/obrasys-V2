"use client";

import React, { useState, useEffect, useCallback } from "react";
import EmptyState from "@/components/EmptyState";
import { LayoutDashboard, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSession } from "@/components/SessionContextProvider";
import { Project } from "@/schemas/project-schema";
import { BudgetDB } from "@/schemas/budget-schema";
import { Invoice, Expense } from "@/schemas/invoicing-schema";
import KPICard from "@/components/KPICard";
import { formatCurrency } from "@/utils/formatters";

// Importar os novos componentes de finanças
import ProjectFinancialOverview from "@/components/finance/ProjectFinancialOverview";
import CashFlowChart from "@/components/finance/CashFlowChart";

const FinancialDashboardsPage = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingFinancialData, setIsLoadingFinancialData] = useState(false);

  // Dados financeiros para o projeto selecionado
  const [projectBudget, setProjectBudget] = useState<BudgetDB | null>(null);
  const [projectInvoices, setProjectInvoices] = useState<Invoice[]>([]);
  const [projectExpenses, setProjectExpenses] = useState<Expense[]>([]);

  // Fetch user's company ID
  const fetchUserCompanyId = useCallback(async () => {
    if (!user) {
      setUserCompanyId(null);
      return;
    }
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("[FinancialDashboardsPage] Erro ao carregar company_id do perfil:", profileError);
      setUserCompanyId(null);
    } else if (profileData) {
      setUserCompanyId(profileData.company_id);
    }
  }, [user]);

  // Fetch projects for the current company
  const fetchProjects = useCallback(async () => {
    if (!userCompanyId) {
      setProjects([]);
      setIsLoadingProjects(false);
      console.log("[FinancialDashboardsPage] fetchProjects: userCompanyId is null, skipping fetch.");
      return;
    }
    setIsLoadingProjects(true);
    console.log("[FinancialDashboardsPage] fetchProjects: Fetching for companyId:", userCompanyId);
    const { data, error } = await supabase
      .from('projects')
      .select('id, nome, custo_planeado, custo_real, budget_id')
      .eq('company_id', userCompanyId)
      .order('nome', { ascending: true });

    if (error) {
      toast.error(`Erro ao carregar obras: ${error.message}`);
      console.error("[FinancialDashboardsPage] Erro ao carregar obras:", error);
      setProjects([]);
    } else {
      setProjects(data || []);
      if (data && data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id); // Select the first project by default
      }
      console.log("[FinancialDashboardsPage] fetchProjects: Data fetched:", data);
    }
    setIsLoadingProjects(false);
  }, [userCompanyId, selectedProjectId]);

  // Fetch financial data for the selected project
  const fetchFinancialData = useCallback(async () => {
    if (!selectedProjectId || !userCompanyId) {
      setProjectBudget(null);
      setProjectInvoices([]);
      setProjectExpenses([]);
      console.log("[FinancialDashboardsPage] fetchFinancialData: selectedProjectId or userCompanyId is null, skipping fetch.");
      return;
    }

    setIsLoadingFinancialData(true);
    console.log("[FinancialDashboardsPage] fetchFinancialData: Fetching for projectId:", selectedProjectId, "companyId:", userCompanyId);

    // Fetch Budget
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('project_id', selectedProjectId)
      .eq('company_id', userCompanyId)
      .single();

    if (budgetError && budgetError.code !== 'PGRST116') {
      console.error("[FinancialDashboardsPage] Erro ao carregar orçamento do projeto:", budgetError);
      toast.error(`Erro ao carregar orçamento: ${budgetError.message}`);
      setProjectBudget(null);
    } else {
      setProjectBudget(budgetData || null);
      console.log("[FinancialDashboardsPage] fetchFinancialData: Budget data:", budgetData);
    }

    // Fetch Invoices
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', selectedProjectId)
      .eq('company_id', userCompanyId)
      .order('issue_date', { ascending: true });

    if (invoicesError) {
      console.error("[FinancialDashboardsPage] Erro ao carregar faturas do projeto:", invoicesError);
      toast.error(`Erro ao carregar faturas: ${invoicesError.message}`);
      setProjectInvoices([]);
    } else {
      setProjectInvoices(invoicesData || []);
      console.log("[FinancialDashboardsPage] fetchFinancialData: Invoices data:", invoicesData);
    }

    // Fetch Expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('company_id', userCompanyId) // Expenses are linked to company_id, not directly project_id in current schema
      .order('due_date', { ascending: true });

    if (expensesError) {
      console.error("[FinancialDashboardsPage] Erro ao carregar despesas da empresa:", expensesError);
      toast.error(`Erro ao carregar despesas: ${expensesError.message}`);
      setProjectExpenses([]);
    } else {
      setProjectExpenses(expensesData || []);
      console.log("[FinancialDashboardsPage] fetchFinancialData: Expenses data:", expensesData);
    }

    setIsLoadingFinancialData(false);
  }, [selectedProjectId, userCompanyId]);

  useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
    console.log("[FinancialDashboardsPage] isSessionLoading:", isSessionLoading, "userCompanyId:", userCompanyId);
  }, [isSessionLoading, fetchUserCompanyId, userCompanyId]);

  useEffect(() => {
    if (userCompanyId) {
      console.log("[FinancialDashboardsPage] userCompanyId is available, triggering project fetch.");
      fetchProjects();
    } else {
      console.log("[FinancialDashboardsPage] userCompanyId is null, skipping project fetch.");
    }
  }, [userCompanyId, fetchProjects]);

  useEffect(() => {
    if (selectedProjectId && userCompanyId) {
      console.log("[FinancialDashboardsPage] selectedProjectId and userCompanyId are available, triggering financial data fetch.");
      fetchFinancialData();
    } else {
      console.log("[FinancialDashboardsPage] selectedProjectId or userCompanyId is null, skipping financial data fetch.");
    }
  }, [selectedProjectId, userCompanyId, fetchFinancialData]);

  const currentProject = projects.find(p => p.id === selectedProjectId);

  if (isLoadingProjects) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 w-40 mt-2 md:mt-0 bg-gray-200 rounded"></div>
        </div>
        <div className="p-4 space-y-4">
          <div className="h-12 w-full bg-gray-100 rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            {[...Array(5)].map((_, i) => (
              <KPICard
                key={i}
                title=""
                value=""
                description=""
                icon={LayoutDashboard}
                iconColorClass="text-transparent"
              />
            ))}
          </div>
          <div className="h-64 w-full bg-gray-100 rounded"></div>
          <div className="h-64 w-full bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Painéis Financeiros Abrangentes
        </h1>
        <Button onClick={() => { fetchProjects(); fetchFinancialData(); }} disabled={isLoadingProjects || isLoadingFinancialData} className="flex items-center gap-2">
          {isLoadingProjects || isLoadingFinancialData ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar Dados
        </Button>
      </div>
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Visualize informações em tempo real sobre custos de trabalho, margens, previsões e fluxo de caixa.
        </p>
      </section>

      <Card className="bg-card text-card-foreground border border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Selecionar Obra</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <Select
              value={selectedProjectId || "placeholder"}
              onValueChange={(value) => setSelectedProjectId(value === "placeholder" ? null : value)}
              disabled={isLoadingProjects || isLoadingFinancialData}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Selecione uma obra para ver os painéis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>Selecione uma obra para ver os painéis</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <EmptyState
              icon={LayoutDashboard}
              title="Nenhuma obra encontrada"
              description="Crie uma nova obra na página de Gestão de Obras para poder visualizar os painéis financeiros."
              buttonText="Ir para Gestão de Obras"
              onButtonClick={() => { /* navigate to projects page */ }}
            />
          )}
        </CardContent>
      </Card>

      {selectedProjectId && currentProject ? (
        isLoadingFinancialData ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">A carregar dados financeiros...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <ProjectFinancialOverview
              project={currentProject}
              budget={projectBudget}
            />

            <CashFlowChart
              invoices={projectInvoices}
              expenses={projectExpenses}
            />

            {/* Placeholder para outros painéis futuros */}
            <Card className="bg-card text-card-foreground border border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Análise de Margem (Em breve)</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={LayoutDashboard}
                  title="Análise de Margem em Desenvolvimento"
                  description="Aqui encontrará gráficos detalhados sobre a margem de lucro do projeto."
                />
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground border border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Previsões de Custos (Em breve)</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={LayoutDashboard}
                  title="Previsões de Custos em Desenvolvimento"
                  description="Aqui serão exibidas previsões de custos futuras baseadas em IA."
                />
              </CardContent>
            </Card>
          </div>
        )
      ) : (
        projects.length > 0 && (
          <EmptyState
            icon={LayoutDashboard}
            title="Selecione uma obra"
            description="Escolha uma obra no menu acima para visualizar os seus painéis financeiros."
          />
        )
      )}
    </div>
  );
};

export default FinancialDashboardsPage;