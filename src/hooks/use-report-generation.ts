"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { Project } from "@/schemas/project-schema";
import { BudgetDB, BudgetItemDB } from "@/schemas/budget-schema";
import { AiAlert } from "@/schemas/ai-alert-schema";

// PDF templates
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
import { generateAiAlertsReportContent } from "@/components/reports/pdf-templates/ai-alerts-report-template";
import { generateComplianceChecklistReportContent } from "@/components/reports/pdf-templates/compliance-checklist-report-template";
import { generateLivroDeObraReportContent } from "@/components/reports/pdf-templates/livro-de-obra-report-template";

/* =========================
   TYPES
========================= */

export enum ReportType {
  FINANCIAL_MONTHLY = "financial_monthly",
  CASHFLOW = "cashflow",
  INVOICES = "invoices",
  EXPENSES = "expenses",
  PAYROLL = "payroll",

  PROJECT_FINANCIAL = "project_financial",
  PROJECT_PROGRESS = "project_progress",
  PROJECT_BUDGET = "project_budget",

  ARTICLES_CATALOG = "articles_catalog",
  AI_ALERTS = "ai_alerts",
  COMPLIANCE_CHECKLIST = "compliance_checklist",
  LIVRO_OBRA = "livro_obra",
}

interface UseReportGenerationResult {
  userCompanyId: string | null;
  projects: Project[];
  isLoadingInitialData: boolean;
  isLoadingReport: boolean;
  handleGenerateReportClick: (
    reportType: ReportType,
    period: { month: string },
    projectId: string | null
  ) => Promise<void>;
}

/* =========================
   HOOK
========================= */

export function useReportGeneration(): UseReportGenerationResult {
  const { user, isLoading: isSessionLoading } = useSession();

  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  /* ---------- Company ---------- */

  const fetchUserCompanyId = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error);
      toast.error("Erro ao identificar empresa.");
      return;
    }

    setUserCompanyId(data.company_id);
  }, [user]);

  /* ---------- Projects ---------- */

  const fetchProjects = useCallback(async () => {
    if (!userCompanyId) return;

    const { data, error } = await supabase
      .from("projects")
      .select("id, nome, budget_id, prazo, created_at, clients(nome)")
      .eq("company_id", userCompanyId)
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar projetos.");
      return;
    }

    setProjects(
      (data || []).map((p: any) => ({
        ...p,
        client_name: p.clients?.nome ?? "Cliente",
      }))
    );
  }, [userCompanyId]);

  useEffect(() => {
    if (!isSessionLoading) fetchUserCompanyId();
  }, [isSessionLoading, fetchUserCompanyId]);

  useEffect(() => {
    if (userCompanyId) {
      setIsLoadingInitialData(true);
      fetchProjects().finally(() => setIsLoadingInitialData(false));
    }
  }, [userCompanyId, fetchProjects]);

  /* =========================
     REPORT GENERATION
  ========================= */

  const handleGenerateReportClick = useCallback(
    async (reportType: ReportType, period: { month: string }, projectId: string | null) => {
      if (!userCompanyId) {
        toast.error("Empresa não identificada.");
        return;
      }

      setIsLoadingReport(true);

      try {
        const { data: company } = await supabase
          .from("companies")
          .select("name")
          .eq("id", userCompanyId)
          .single();

        const companyName = company?.name ?? "Obra Sys";
        const now = format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt });

        const start = startOfMonth(parseISO(period.month));
        const end = endOfMonth(parseISO(period.month));

        let content = "";

        switch (reportType) {
          case ReportType.INVOICES: {
            const { data } = await supabase
              .from("invoices")
              .select("*, clients(nome)")
              .eq("company_id", userCompanyId)
              .gte("issue_date", format(start, "yyyy-MM-dd"))
              .lte("issue_date", format(end, "yyyy-MM-dd"));

            content = generateInvoicesReportContent(
              { invoices: data ?? [], period: { from: start.toISOString(), to: end.toISOString() } },
              companyName,
              now
            );
            break;
          }

          case ReportType.PROJECT_FINANCIAL: {
            if (!projectId) throw new Error("Projeto obrigatório.");

            const project = projects.find(p => p.id === projectId);
            if (!project) throw new Error("Projeto não encontrado.");

            let budget: BudgetDB | null = null;
            let items: BudgetItemDB[] = [];

            if (project.budget_id) {
              const { data } = await supabase
                .from("budgets")
                .select("*, budget_chapters(budget_items(*))")
                .eq("id", project.budget_id)
                .single();

              if (data) {
                budget = data;
                items = data.budget_chapters.flatMap((c: any) => c.budget_items);
              }
            }

            const { data: invoices } = await supabase
              .from("invoices")
              .select("*, clients(nome)")
              .eq("project_id", projectId);

            const { data: alerts } = await supabase
              .from("ai_alerts")
              .select("*")
              .eq("project_id", projectId)
              .in("severity", ["critical", "warning"])
              .eq("resolved", false);

            content = generateProjectFinancialReportContent(
              {
                project,
                budget,
                budgetItems: items,
                projectInvoices: invoices ?? [],
                projectAlerts: alerts ?? [],
              },
              companyName,
              now
            );
            break;
          }

          // Outros casos seguem o mesmo padrão
          default:
            toast.info("Relatório ainda não implementado.");
            return;
        }

        const html = generateBasePdfTemplate({
          title: "Relatório",
          companyName,
          content,
          currentDate: now,
          includeWebControls: true,
        });

        const win = window.open("", "_blank");
        win?.document.write(html);
        win?.document.close();
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Erro ao gerar relatório.");
      } finally {
        setIsLoadingReport(false);
      }
    },
    [userCompanyId, projects]
  );

  return {
    userCompanyId,
    projects,
    isLoadingInitialData,
    isLoadingReport,
    handleGenerateReportClick,
  };
}
