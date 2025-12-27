"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { Project } from "@/schemas/project-schema";
import { Invoice, Expense, Payment, InvoiceWithRelations } from "@/schemas/invoicing-schema";
import { BudgetDB, BudgetItemDB, BudgetChapterDB } from "@/schemas/budget-schema";
import { AiAlert } from "@/schemas/ai-alert-schema";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Company } from "@/schemas/profile-schema";

// Import modular PDF templates
import { generateBasePdfTemplate } from "@/components/reports/pdf-templates/base-template";
import { generateMonthlyFinancialReportContent } from "@/components/reports/pdf-templates/monthly-financial-report-template";
import { generateCashFlowReportContent } from "@/components/reports/pdf-templates/cash-flow-report-template";
import { generateProjectFinancialReportContent } from "@/components/reports/pdf-templates/project-financial-report-template";
import { generateInvoicesReportContent } from "@/components/reports/pdf-templates/invoices-report-template";
import { generateExpensesReportContent } from "@/components/reports/pdf-templates/expenses-report-template";
import { generatePayrollReportContent } from "@/components/reports/pdf-templates/payroll-report-template";
import { generateProjectProgressReportContent } from "@/components/reports/pdf-templates/project-progress-report-template";
import { generateProjectBudgetReportContent } from "@/components/reports/pdf-templates/project-budget-report-template";
import { generateArticlesCatalogReportContent } from "@/components/reports/pdf-templates/articles-catalog-report-template";
import { generatePriceHistoryReportContent } from "@/components/reports/pdf-templates/price-history-report-template";
import { generateAiAlertsReportContent } from "@/components/reports/pdf-templates/ai-alerts-report-template";
import { generateComplianceChecklistReportContent } from "@/components/reports/pdf-templates/compliance-checklist-report-template";
import { generateLivroDeObraReportContent } from "@/components/reports/pdf-templates/livro-de-obra-report-template";


interface UseReportGenerationResult {
  userCompanyId: string | null;
  projects: Project[];
  isLoadingInitialData: boolean;
  isLoadingReport: boolean;
  handleGenerateReportClick: (reportName: string, selectedMonth: string, selectedProjectIdForReport: string | null) => Promise<void>;
}

export function useReportGeneration(): UseReportGenerationResult {
  const { user, isLoading: isSessionLoading } = useSession();
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

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
      console.error("Erro ao carregar company_id do perfil:", profileError);
      setUserCompanyId(null);
    } else if (profileData) {
      setUserCompanyId(profileData.company_id);
    }
  }, [user]);

  // Fetch projects for the project selector
  const fetchProjects = useCallback(async () => {
    if (!userCompanyId) {
      setProjects([]);
      return;
    }
    const { data, error } = await supabase
      .from('projects')
      .select('id, nome, client_id, localizacao, custo_planeado, custo_real, budget_id, prazo, created_at, clients(nome)')
      .eq('company_id', userCompanyId)
      .order('nome', { ascending: true });

    if (error) {
      toast.error(`Erro ao carregar obras: ${error.message}`);
      console.error("Erro ao carregar obras:", error);
      setProjects([]);
    } else {
      const formattedProjects: Project[] = (data || []).map((project: any) => ({
        ...project,
        client_name: project.clients?.nome || "Cliente Desconhecido",
      }));
      setProjects(formattedProjects);
    }
  }, [userCompanyId]);

  useEffect(() => {
    if (!isSessionLoading) {
      fetchUserCompanyId();
    }
  }, [isSessionLoading, fetchUserCompanyId]);

  useEffect(() => {
    const loadInitialData = async () => {
      if (userCompanyId) {
        setIsLoadingInitialData(true);
        await fetchProjects();
        setIsLoadingInitialData(false);
      }
    };
    loadInitialData();
  }, [userCompanyId, fetchProjects]);

  const handleGenerateReportClick = useCallback(async (reportName: string, selectedMonth: string, selectedProjectIdForReport: string | null) => {
    if (!userCompanyId) {
      toast.error("ID da empresa não encontrado. Por favor, faça login novamente.");
      return;
    }
    setIsLoadingReport(true);
    let reportData: any = { company: null, monthYear: selectedMonth };
    let reportContentHtml = '';
    const currentDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt });

    try {
      // Fetch company data
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userCompanyId)
        .single();
      if (companyError) console.error("Error fetching company data:", companyError);
      reportData.company = company;
      const companyName = company?.name || "Obra Sys Construções";

      const startOfSelectedMonth = startOfMonth(parseISO(selectedMonth));
      const endOfSelectedMonth = endOfMonth(parseISO(selectedMonth));
      const startOfPrevMonth = startOfMonth(subMonths(parseISO(selectedMonth), 1));
      const endOfPrevMonth = endOfMonth(subMonths(parseISO(selectedMonth), 1));

      if (reportName === "Relatório Financeiro Mensal") {
        // Fetch invoices for current month
        const { data: currentMonthInvoices, error: invError } = await supabase
          .from('invoices')
          .select('total_amount, paid_amount')
          .eq('company_id', userCompanyId)
          .gte('issue_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('issue_date', format(endOfSelectedMonth, 'yyyy-MM-dd'))
          .in('status', ['paid', 'pending']);
        if (invError) throw invError;
        const totalRevenue = (currentMonthInvoices || []).reduce((sum, inv) => sum + inv.total_amount, 0);

        // Fetch expenses for current month
        const { data: currentMonthExpenses, error: expError } = await supabase
          .from('expenses')
          .select('amount, description') // Using description as a mock category for now
          .eq('company_id', userCompanyId)
          .gte('due_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('due_date', format(endOfSelectedMonth, 'yyyy-MM-dd'))
          .in('status', ['paid', 'pending', 'overdue']);
        if (expError) throw expError;
        const totalExpenses = (currentMonthExpenses || []).reduce((sum, exp) => sum + exp.amount, 0);

        // Fetch invoices for previous month for comparison
        const { data: prevMonthInvoices, error: prevInvError } = await supabase
          .from('invoices')
          .select('total_amount')
          .eq('company_id', userCompanyId)
          .gte('issue_date', format(startOfPrevMonth, 'yyyy-MM-dd'))
          .lte('issue_date', format(endOfPrevMonth, 'yyyy-MM-dd'))
          .in('status', ['paid', 'pending']);
        if (prevInvError) throw prevInvError;
        const prevMonthRevenue = (prevMonthInvoices || []).reduce((sum, inv) => sum + inv.total_amount, 0);

        const profitLoss = totalRevenue - totalExpenses;
        const prevMonthComparison = prevMonthRevenue > 0 ? ((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

        // Simplified revenue by source and expenses by category
        const revenueBySource = [
          { source: "Faturas Emitidas", value: totalRevenue, percentage: totalRevenue > 0 ? (totalRevenue / totalRevenue) * 100 : 0 },
        ];
        const expensesByCategory = [
          { category: "Despesas Registadas", value: totalExpenses },
        ];

        reportData = {
          ...reportData,
          totalRevenue,
          totalExpenses,
          profitLoss,
          prevMonthComparison,
          revenueBySource,
          expensesByCategory,
          period: `${format(startOfSelectedMonth, "dd/MM/yyyy")} - ${format(endOfSelectedMonth, "dd/MM/yyyy")}`,
        };
        reportContentHtml = generateMonthlyFinancialReportContent(reportData, companyName, currentDate);

      } else if (reportName === "Relatório de Fluxo de Caixa") {
        // Fetch all payments and expenses for the year to calculate initial balance
        const startOfYear = startOfMonth(new Date(new Date().getFullYear(), 0, 1));
        const { data: allPayments, error: allPaymentsError } = await supabase
          .from('payments')
          .select('amount, payment_date')
          .eq('company_id', userCompanyId)
          .gte('payment_date', format(startOfYear, 'yyyy-MM-dd'))
          .lte('payment_date', format(endOfSelectedMonth, 'yyyy-MM-dd'));
        if (allPaymentsError) throw allPaymentsError;

        const { data: allExpenses, error: allExpensesError } = await supabase
          .from('expenses')
          .select('amount, due_date')
          .eq('company_id', userCompanyId)
          .gte('due_date', format(startOfYear, 'yyyy-MM-dd'))
          .lte('due_date', format(endOfSelectedMonth, 'yyyy-MM-dd'));
        if (allExpensesError) throw allExpensesError;

        let initialBalance = 0;
        // Calculate balance up to the start of the selected month
        (allPayments || []).forEach(p => {
          if (parseISO(p.payment_date) < startOfSelectedMonth) initialBalance += p.amount;
        });
        (allExpenses || []).forEach(e => {
          if (parseISO(e.due_date) < startOfSelectedMonth) initialBalance -= e.amount;
        });

        // Fetch payments for current month
        const { data: currentMonthPayments, error: paymentsError } = await supabase
          .from('payments')
          .select('amount, payment_date, invoices(invoice_number)')
          .eq('company_id', userCompanyId)
          .gte('payment_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('payment_date', format(endOfSelectedMonth, 'yyyy-MM-dd'));
        if (paymentsError) throw paymentsError;
        const totalEntries = (currentMonthPayments || []).reduce((sum, p) => sum + p.amount, 0);
        const entries = (currentMonthPayments || []).map(p => ({
          date: p.payment_date,
          origin: `Pagamento Fatura ${p.invoices?.[0]?.invoice_number || 'N/A'}`,
          amount: p.amount,
        }));

        // Fetch expenses for current month
        const { data: currentMonthExpensesFlow, error: expensesFlowError } = await supabase
          .from('expenses')
          .select('amount, due_date, description')
          .eq('company_id', userCompanyId)
          .gte('due_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('due_date', format(endOfSelectedMonth, 'yyyy-MM-dd'));
        if (expensesFlowError) throw expensesFlowError;
        const totalExits = (currentMonthExpensesFlow || []).reduce((sum, exp) => sum + exp.amount, 0);
        const exits = (currentMonthExpensesFlow || []).map(exp => ({
          date: exp.due_date,
          destination: exp.description,
          amount: exp.amount,
        }));

        const finalBalance = initialBalance + totalEntries - totalExits;

        // Mock forecast for now
        const forecast = {
          next30Days: finalBalance + 1500,
          next60Days: finalBalance + 2800,
          next90Days: finalBalance + 4000,
        };

        reportData = {
          ...reportData,
          initialBalance,
          totalEntries,
          totalExits,
          finalBalance,
          entries,
          exits,
          forecast,
          period: `${format(startOfSelectedMonth, "dd/MM/yyyy")} - ${format(endOfSelectedMonth, "dd/MM/yyyy")}`,
        };
        reportContentHtml = generateCashFlowReportContent(reportData, companyName, currentDate);

      } else if (reportName === "Relatório Financeiro por Projeto / Obra") {
        if (!selectedProjectIdForReport) {
          toast.error("Selecione um projeto para gerar este relatório.");
          return;
        }
        const project = projects.find(p => p.id === selectedProjectIdForReport);
        if (!project) {
          toast.error("Projeto não encontrado.");
          return;
        }

        // Fetch budget for the project
        let budget: BudgetDB | null = null;
        let budgetItems: BudgetItemDB[] = [];
        if (project.budget_id) {
          const { data: fetchedBudget, error: budgetError } = await supabase
            .from('budgets')
            .select(`
              *,
              budget_chapters (
                budget_items (*)
              )
            `)
            .eq('id', project.budget_id)
            .single();
          if (budgetError && budgetError.code !== 'PGRST116') throw budgetError;
          if (fetchedBudget) {
            budget = fetchedBudget;
            budgetItems = fetchedBudget.budget_chapters.flatMap((chapter: any) => chapter.budget_items);
          }
        }

        // Fetch invoices for the project
        const { data: projectInvoices, error: invError } = await supabase
          .from('invoices')
          .select('*, clients(nome), projects(nome)')
          .eq('project_id', selectedProjectIdForReport)
          .eq('company_id', userCompanyId);
        if (invError) throw invError;

        // Fetch AI alerts for the project
        const { data: projectAlerts, error: alertsError } = await supabase
          .from('ai_alerts')
          .select('id, title, message, severity, created_at, projects(nome)')
          .eq('project_id', selectedProjectIdForReport)
          .eq('company_id', userCompanyId)
          .in('severity', ['critical', 'warning'])
          .eq('resolved', false)
          .order('created_at', { ascending: false });
        if (alertsError) throw alertsError;

        reportData = {
          ...reportData,
          project,
          budget,
          budgetItems,
          projectInvoices,
          projectAlerts: projectAlerts || [],
          period: `${format(parseISO(project.created_at!), "dd/MM/yyyy")} - ${project.prazo ? format(parseISO(project.prazo), "dd/MM/yyyy") : 'N/A'}`,
        };
        reportContentHtml = generateProjectFinancialReportContent(reportData, companyName, currentDate);

      } else if (reportName === "Faturas") {
        const { data: invoices, error: invError } = await supabase
          .from('invoices')
          .select('*, clients(nome), projects(nome)')
          .eq('company_id', userCompanyId)
          .gte('issue_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('issue_date', format(endOfSelectedMonth, 'yyyy-MM-dd'))
          .order('issue_date', { ascending: false });
        if (invError) throw invError;
        reportData = {
          ...reportData,
          invoices: invoices || [],
          period: `${format(startOfSelectedMonth, "dd/MM/yyyy")} - ${format(endOfSelectedMonth, "dd/MM/yyyy")}`,
        };
        reportContentHtml = generateInvoicesReportContent(reportData, companyName, currentDate);

      } else if (reportName === "Despesas") {
        const { data: expenses, error: expError } = await supabase
          .from('expenses')
          .select('*')
          .eq('company_id', userCompanyId)
          .gte('due_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('due_date', format(endOfSelectedMonth, 'yyyy-MM-dd'))
          .order('due_date', { ascending: false });
        if (expError) throw expError;
        reportData = {
          ...reportData,
          expenses: expenses || [],
          period: `${format(startOfSelectedMonth, "dd/MM/yyyy")} - ${format(endOfSelectedMonth, "dd/MM/yyyy")}`,
        };
        reportContentHtml = generateExpensesReportContent(reportData, companyName, currentDate);

      } else if (reportName === "Folha de Pagamento") {
        const { data: payrollEntries, error: payrollError } = await supabase
          .from('payroll_entries')
          .select('*, projects(nome), users:profiles(first_name, last_name)')
          .eq('company_id', userCompanyId)
          .gte('entry_date', format(startOfSelectedMonth, 'yyyy-MM-dd'))
          .lte('entry_date', format(endOfSelectedMonth, 'yyyy-MM-dd'))
          .order('entry_date', { ascending: false });
        if (payrollError) throw payrollError;
        reportData = {
          ...reportData,
          payrollEntries: payrollEntries || [],
          period: `${format(startOfSelectedMonth, "dd/MM/yyyy")} - ${format(endOfSelectedMonth, "yyyy-MM-dd")}`,
        };
        reportContentHtml = generatePayrollReportContent(reportData, companyName, currentDate);

      } else if (reportName === "Progresso da Obra") {
        if (!selectedProjectIdForReport) {
          toast.error("Selecione um projeto para gerar este relatório.");
          return;
        }
        const project = projects.find(p => p.id === selectedProjectIdForReport);
        if (!project) {
          toast.error("Projeto não encontrado.");
          return;
        }

        let scheduleTasks: any[] = [];
        if (project.budget_id) {
          const { data: schedule, error: scheduleError } = await supabase
            .from('schedules')
            .select('id')
            .eq('project_id', project.id)
            .single();
          if (scheduleError && scheduleError.code !== 'PGRST116') throw scheduleError;

          if (schedule) {
            const { data: tasks, error: tasksError } = await supabase
              .from('schedule_tasks')
              .select('*')
              .eq('schedule_id', schedule.id)
              .order('ordem', { ascending: true });
            if (tasksError) throw tasksError;
            scheduleTasks = tasks || [];
          }
        }

        reportData = {
          ...reportData,
          project,
          scheduleTasks,
          period: `${format(parseISO(project.created_at!), "dd/MM/yyyy")} - ${project.prazo ? format(parseISO(project.prazo), "dd/MM/yyyy") : 'N/A'}`,
        };
        reportContentHtml = generateProjectProgressReportContent(reportData, companyName, currentDate);

      } else if (reportName === "Orçamento da Obra") {
        if (!selectedProjectIdForReport) {
          toast.error("Selecione um projeto para gerar este relatório.");
          return;
        }
        const project = projects.find(p => p.id === selectedProjectIdForReport);
        if (!project) {
          toast.error("Projeto não encontrado.");
          return;
        }

        let budget: BudgetDB | null = null;
        let budgetItems: BudgetItemDB[] = [];
        if (project.budget_id) {
          const { data: fetchedBudget, error: budgetError } = await supabase
            .from('budgets')
            .select(`
              *,
              budget_chapters (
                budget_items (*)
              )
            `)
            .eq('id', project.budget_id)
            .single();
          if (budgetError && budgetError.code !== 'PGRST116') throw budgetError;
          if (fetchedBudget) {
            budget = fetchedBudget;
            budgetItems = fetchedBudget.budget_chapters.flatMap((chapter: any) => chapter.budget_items);
          }
        }

        reportData = {
          ...reportData,
          project,
          budget,
          budgetItems,
          period: `${format(parseISO(project.created_at!), "dd/MM/yyyy")} - ${project.prazo ? format(parseISO(project.prazo), "dd/MM/yyyy") : 'N/A'}`,
        };
        reportContentHtml = generateProjectBudgetReportContent(reportData, companyName, currentDate);

      } else if (reportName === "Catálogo de Artigos") {
        const { data: articles, error: articlesError } = await supabase
          .from('articles')
          .select('*, categories(nome)')
          .eq('company_id', userCompanyId)
          .order('codigo', { ascending: true });
        if (articlesError) throw articlesError;
        reportData = { ...reportData, articles: articles || [] };
        reportContentHtml = generateArticlesCatalogReportContent(reportData, companyName, currentDate);

      } else if (reportName === "Histórico de Preços") {
        // This report is more complex and would require a dedicated price history table or more advanced logic.
        // Keeping it as a placeholder for now.
        toast.info("Este relatório requer dados de histórico de preços que ainda não estão implementados.");
        return;
      } else if (reportName === "Alertas de IA") {
        const { data: alerts, error: alertsError } = await supabase
          .from('ai_alerts')
          .select('*, projects(nome)')
          .eq('company_id', userCompanyId)
          .order('created_at', { ascending: false });
        if (alertsError) throw alertsError;
        reportData = { ...reportData, alerts: alerts || [] };
        reportContentHtml = generateAiAlertsReportContent(reportData, companyName, currentDate);
      } else if (reportName === "Checklist de Conformidade") {
        reportContentHtml = generateComplianceChecklistReportContent(reportData, companyName, currentDate);
      } else if (reportName === "Livro de Obra Digital") {
        reportContentHtml = generateLivroDeObraReportContent(reportData, companyName, currentDate);
      }

      const finalHtml = generateBasePdfTemplate(reportName, companyName, reportContentHtml, currentDate);

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(finalHtml);
        printWindow.document.close();
        printWindow.focus();
      } else {
        toast.error("Não foi possível abrir a janela de impressão. Verifique as configurações de pop-up.");
      }
    } catch (error: any) {
      toast.error(`Erro ao gerar relatório: ${error.message}`);
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setIsLoadingReport(false);
    }
  }, [userCompanyId, projects]);

  return {
    userCompanyId,
    projects,
    isLoadingInitialData,
    isLoadingReport,
    handleGenerateReportClick,
  };
}