"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/SessionContextProvider";
import { Project } from "@/schemas/project-schema";
import { BudgetDB, BudgetItemDB } from "@/schemas/budget-schema";

import { generateBasePdfTemplate } from "@/components/reports/pdf-templates/base-template";
import { generateInvoicesReportContent } from "@/components/reports/pdf-templates/invoices-report-template";
import { generateProjectFinancialReportContent } from "@/components/reports/pdf-templates/project-financial-report-template";

/* =========================
   TYPES
========================= */

export enum ReportType {
  INVOICES = "invoices",
  PROJECT_FINANCIAL = "project_financial",
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

type PdfApiResponse =
  | { ok: true; signedUrl?: string; path?: string; reportId?: string; size?: number }
  | { ok?: false; error: string };

/* =========================
   HOOK
========================= */

export function useReportGeneration(): UseReportGenerationResult {
  const { user, isLoading: isSessionLoading } = useSession();

  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

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

  const handleGenerateReportClick = useCallback(
    async (reportType: ReportType, period: { month: string }, projectId: string | null) => {
      if (!userCompanyId) {
        toast.error("Empresa não identificada.");
        return;
      }

      setIsLoadingReport(true);

      try {
        // 1) Empresa
        const { data: company } = await supabase
          .from("companies")
          .select("name")
          .eq("id", userCompanyId)
          .single();

        const companyName = company?.name ?? "Obra Sys";
        const now = format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt });

        // 2) Período
        const start = startOfMonth(parseISO(period.month));
        const end = endOfMonth(parseISO(period.month));

        // 3) Gerar conteúdo + título (HTML interno)
        let contentHtml = "";
        let title = "Relatório";
        let reportTitle = "Relatório";
        let selectedProject: Project | null = null;

        switch (reportType) {
          case ReportType.INVOICES: {
            const { data, error } = await supabase
              .from("invoices")
              .select("*, clients(nome)")
              .eq("company_id", userCompanyId)
              .gte("issue_date", format(start, "yyyy-MM-dd"))
              .lte("issue_date", format(end, "yyyy-MM-dd"))
              .order("issue_date", { ascending: false });

            if (error) throw error;

            contentHtml = generateInvoicesReportContent(
              {
                invoices: data ?? [],
                period: { from: start.toISOString(), to: end.toISOString() },
              },
              companyName,
              now
            );

            title = "Relatório de Faturas";
            reportTitle = "Relatório de Faturas";
            break;
          }

          case ReportType.PROJECT_FINANCIAL: {
            if (!projectId) throw new Error("Projeto obrigatório para este relatório.");

            const project = projects.find((p) => p.id === projectId);
            if (!project) throw new Error("Projeto não encontrado.");

            selectedProject = project;

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

            contentHtml = generateProjectFinancialReportContent(
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

            title = "Relatório Financeiro por Projeto / Obra";
            reportTitle = `Relatório Financeiro — ${project.nome ?? "Obra"}`;
            break;
          }

          default:
            toast.info("Relatório ainda não implementado.");
            return;
        }

        // 4) HTML FINAL (base template)
        const finalHtml = generateBasePdfTemplate({
          title,
          companyName,
          content: contentHtml,
          currentDate: now,
          includeWebControls: true, // preview
        });

        // 5) Preview HTML (opcional)
        const previewWindow = window.open("", "_blank");
        if (previewWindow) {
          previewWindow.document.write(finalHtml);
          previewWindow.document.close();
          previewWindow.focus();
        } else {
          toast.error("Popup bloqueado. Autorize popups para preview.");
        }

        // 6) Gerar PDF REAL via API Playwright + guardar no Storage + histórico
        const resp = await fetch("/api/reports/render-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html: finalHtml,
            companyId: userCompanyId,
            projectId: selectedProject?.id ?? null,
            reportType: reportType,
            reportTitle: reportTitle,
            period: {
              month: period.month,
              from: start.toISOString(),
              to: end.toISOString(),
            },
          }),
        });

        const json = (await resp.json()) as PdfApiResponse;

        if (!resp.ok || "error" in json) {
          throw new Error(("error" in json ? json.error : "Erro ao gerar PDF") || "Erro ao gerar PDF");
        }

        toast.success("PDF gerado e guardado com sucesso.");

        if (json.signedUrl) {
          window.open(json.signedUrl, "_blank");
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message ?? "Erro ao gerar relatório.");
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