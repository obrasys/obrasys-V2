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
  | {
      ok: true;
      signedUrl?: string;
      path?: string;
      reportId?: string;
      size?: number;
    }
  | { ok?: false; error: string };

function getErrorMessage(err: unknown): string {
  if (!err) return "Erro desconhecido";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  const anyErr = err as any;
  return anyErr?.message ?? "Erro desconhecido";
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

  /* =========================
     FETCH COMPANY
  ========================= */

  const fetchUserCompanyId = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(
        "[useReportGeneration.fetchUserCompanyId] error",
        error
      );
      toast.error("Erro ao identificar empresa.");
      return;
    }

    setUserCompanyId(data?.company_id ?? null);
  }, [user]);

  /* =========================
     FETCH PROJECTS
  ========================= */

  const fetchProjects = useCallback(async () => {
    if (!userCompanyId) return;

    const { data, error } = await supabase
      .from("projects")
      .select("id, nome, budget_id, prazo, created_at, clients(nome)")
      .eq("company_id", userCompanyId)
      .order("nome");

    if (error) {
      console.error(
        "[useReportGeneration.fetchProjects] error",
        error
      );
      toast.error("Erro ao carregar projetos.");
      return;
    }

    setProjects(
      (data ?? []).map((p: any) => ({
        ...p,
        client_name: p.clients?.nome ?? "Cliente",
      }))
    );
  }, [userCompanyId]);

  /* =========================
     EFFECTS
  ========================= */

  useEffect(() => {
    if (!isSessionLoading) fetchUserCompanyId();
  }, [isSessionLoading, fetchUserCompanyId]);

  useEffect(() => {
    if (!userCompanyId) return;

    setIsLoadingInitialData(true);
    fetchProjects().finally(() => setIsLoadingInitialData(false));
  }, [userCompanyId, fetchProjects]);

  /* =========================
     GENERATE REPORT
  ========================= */

  const handleGenerateReportClick = useCallback(
    async (
      reportType: ReportType,
      period: { month: string },
      projectId: string | null
    ) => {
      if (!userCompanyId) {
        toast.error("Empresa não identificada.");
        return;
      }

      setIsLoadingReport(true);

      try {
        /* ========= Empresa ========= */

        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("name")
          .eq("id", userCompanyId)
          .single();

        if (companyError) {
          console.error(
            "[useReportGeneration.company] error",
            companyError
          );
          toast.error("Erro ao carregar dados da empresa.");
          return;
        }

        const companyName = company?.name ?? "Obra Sys";
        const now = format(new Date(), "dd/MM/yyyy HH:mm", { locale: pt });

        /* ========= Período ========= */

        if (!period?.month) {
          toast.error("Período inválido.");
          return;
        }

        const start = startOfMonth(parseISO(period.month));
        const end = endOfMonth(parseISO(period.month));

        /* ========= Conteúdo ========= */

        let contentHtml = "";
        let title = "Relatório";
        let reportTitle = "Relatório";
        let selectedProject: Project | null = null;

        if (reportType === ReportType.INVOICES) {
          const { data, error } = await supabase
            .from("invoices")
            .select("*, clients(nome)")
            .eq("company_id", userCompanyId)
            .gte("issue_date", format(start, "yyyy-MM-dd"))
            .lte("issue_date", format(end, "yyyy-MM-dd"))
            .order("issue_date", { ascending: false });

          if (error) {
            console.error(
              "[useReportGeneration.invoices] error",
              error
            );
            toast.error("Erro ao carregar faturas.");
            return;
          }

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
        }

        if (reportType === ReportType.PROJECT_FINANCIAL) {
          if (!projectId) {
            toast.error("Projeto obrigatório para este relatório.");
            return;
          }

          const project = projects.find((p) => p.id === projectId);
          if (!project) {
            toast.error("Projeto não encontrado.");
            return;
          }

          selectedProject = project;

          let budget: BudgetDB | null = null;
          let items: BudgetItemDB[] = [];

          if (project.budget_id) {
            const { data, error } = await supabase
              .from("budgets")
              .select("*, budget_chapters(budget_items(*))")
              .eq("id", project.budget_id)
              .single();

            if (error) {
              console.error(
                "[useReportGeneration.budget] error",
                error
              );
              toast.error("Erro ao carregar orçamento do projeto.");
              return;
            }

            if (data) {
              budget = data;
              items = data.budget_chapters.flatMap(
                (c: any) => c.budget_items
              );
            }
          }

          const { data: invoices, error: invoicesError } = await supabase
            .from("invoices")
            .select("*, clients(nome)")
            .eq("project_id", projectId);

          if (invoicesError) {
            console.error(
              "[useReportGeneration.project.invoices] error",
              invoicesError
            );
            toast.error("Erro ao carregar faturas do projeto.");
            return;
          }

          const { data: alerts, error: alertsError } = await supabase
            .from("ai_alerts")
            .select("*")
            .eq("project_id", projectId)
            .in("severity", ["critical", "warning"])
            .eq("resolved", false);

          if (alertsError) {
            console.error(
              "[useReportGeneration.project.alerts] error",
              alertsError
            );
            toast.error("Erro ao carregar alertas do projeto.");
            return;
          }

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
        }

        if (!contentHtml) {
          toast.info("Relatório não disponível.");
          return;
        }

        /* ========= HTML FINAL ========= */

        const finalHtml = generateBasePdfTemplate({
          title,
          companyName,
          content: contentHtml,
          currentDate: now,
          includeWebControls: true,
        });

        /* ========= Preview ========= */

        const previewWindow = window.open("", "_blank");
        if (previewWindow) {
          previewWindow.document.write(finalHtml);
          previewWindow.document.close();
          previewWindow.focus();
        } else {
          toast.error("Popup bloqueado. Autorize pop-ups para preview.");
        }

        /* ========= Render PDF ========= */

        const resp = await fetch("/api/reports/render-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html: finalHtml,
            companyId: userCompanyId,
            projectId: selectedProject?.id ?? null,
            reportType,
            reportTitle,
            period: {
              month: period.month,
              from: start.toISOString(),
              to: end.toISOString(),
            },
          }),
        });

        if (!resp.ok) {
          console.error(
            "[useReportGeneration.render-pdf] HTTP error",
            resp.status
          );
          toast.error("Erro ao gerar PDF.");
          return;
        }

        const json = (await resp.json()) as PdfApiResponse;

        if ("error" in json) {
          console.error(
            "[useReportGeneration.render-pdf] API error",
            json.error
          );
          toast.error(json.error);
          return;
        }

        toast.success("PDF gerado e guardado com sucesso.");

        if (json.signedUrl) {
          window.open(json.signedUrl, "_blank");
        }
      } catch (err) {
        const msg = getErrorMessage(err);
        console.error("[useReportGeneration] unexpected error", err);
        toast.error(msg);
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
