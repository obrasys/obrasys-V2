"use client";

import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  HardHat,
  ClipboardList,
  Scale,
  BellRing,
  CheckSquare,
  BookText,
  Wallet,
  ReceiptText,
  TrendingUp,
  History,
  Archive,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import ReportHeader from "@/components/reports/ReportHeader";
import ReportDescription from "@/components/reports/ReportDescription";
import ReportParameters from "@/components/reports/ReportParameters";
import ReportCard from "@/components/reports/ReportCard";

import {
  useReportGeneration,
  ReportType,
} from "@/hooks/use-report-generation";

import { format } from "date-fns";

const ReportsPage = () => {
  const {
    projects,
    isLoadingInitialData,
    isLoadingReport,
    handleGenerateReportClick,
  } = useReportGeneration();

  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [selectedProjectIdForReport, setSelectedProjectIdForReport] =
    useState<string | null>(null);

  if (isLoadingInitialData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 md:pb-6 border-b border-border mb-4 md:mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40 mt-2 md:mt-0" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportHeader />
      <ReportDescription />

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      <ReportParameters
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedProjectIdForReport={selectedProjectIdForReport}
        setSelectedProjectIdForReport={setSelectedProjectIdForReport}
        projects={projects}
        isLoadingProjects={isLoadingInitialData}
      />

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* ======================
          Relatórios Financeiros
      ====================== */}
      <h2 className="text-xl font-semibold mb-4 text-primary">
        Relatórios Financeiros
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <ReportCard
          title="Relatório Financeiro Mensal"
          description="Acompanhe a saúde financeira mês a mês e apoie decisões rápidas."
          icon={Scale}
          buttonText="Gerar Relatório"
          onClick={() =>
            handleGenerateReportClick(
              ReportType.FINANCIAL_MONTHLY,
              { month: selectedMonth },
              null
            )
          }
          isLoading={isLoadingReport}
        />

        <ReportCard
          title="Relatório de Fluxo de Caixa"
          description="Garantir liquidez e evitar surpresas."
          icon={TrendingUp}
          buttonText="Gerar Relatório"
          onClick={() =>
            handleGenerateReportClick(
              ReportType.CASHFLOW,
              { month: selectedMonth },
              null
            )
          }
          isLoading={isLoadingReport}
        />

        <ReportCard
          title="Relatório de Faturas"
          description="Visão geral das faturas emitidas, pagas e pendentes."
          icon={ReceiptText}
          buttonText="Gerar Relatório"
          onClick={() =>
            handleGenerateReportClick(
              ReportType.INVOICES,
              { month: selectedMonth },
              null
            )
          }
          isLoading={isLoadingReport}
        />

        <ReportCard
          title="Relatório de Despesas"
          description="Análise detalhada das despesas por fornecedor, categoria e estado."
          icon={Wallet}
          buttonText="Gerar Relatório"
          onClick={() =>
            handleGenerateReportClick(
              ReportType.EXPENSES,
              { month: selectedMonth },
              null
            )
          }
          isLoading={isLoadingReport}
        />

        <ReportCard
          title="Relatório de Folha de Pagamento"
          description="Custos de mão de obra, salários e benefícios."
          icon={ClipboardList}
          buttonText="Gerar Relatório"
          onClick={() =>
            handleGenerateReportClick(
              ReportType.PAYROLL,
              { month: selectedMonth },
              null
            )
          }
          isLoading={isLoadingReport}
        />
      </div>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* ======================
          Relatórios de Obra
      ====================== */}
      <h2 className="text-xl font-semibold mb-4 text-primary">
        Relatórios de Obra
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <ReportCard
          title="Relatório Financeiro por Projeto / Obra"
          description="Controlar rentabilidade de cada obra/projeto."
          icon={HardHat}
          buttonText="Gerar Relatório"
          onClick={() =>
            handleGenerateReportClick(
              ReportType.PROJECT_FINANCIAL,
              { month: selectedMonth },
              selectedProjectIdForReport
            )
          }
          disabled={!selectedProjectIdForReport}
          isLoading={isLoadingReport}
          infoText={
            !selectedProjectIdForReport
              ? "Selecione uma obra para gerar este relatório."
              : undefined
          }
        />

        <ReportCard
          title="Relatório de Progresso da Obra"
          description="Acompanhamento do progresso físico e financeiro."
          icon={HardHat}
          buttonText="Gerar Relatório"
          onClick={() =>
            handleGenerateReportClick(
              ReportType.PROJECT_PROGRESS,
              { month: selectedMonth },
              selectedProjectIdForReport
            )
          }
          disabled={!selectedProjectIdForReport}
          isLoading={isLoadingReport}
          infoText={
            !selectedProjectIdForReport
              ? "Selecione uma obra para gerar este relatório."
              : undefined
          }
        />

        <ReportCard
          title="Relatório de Orçamento da Obra"
          description="Comparativo entre orçamento planeado e custo real."
          icon={DollarSign}
          buttonText="Gerar Relatório"
          onClick={() =>
            handleGenerateReportClick(
              ReportType.PROJECT_BUDGET,
              { month: selectedMonth },
              selectedProjectIdForReport
            )
          }
          disabled={!selectedProjectIdForReport}
          isLoading={isLoadingReport}
          infoText={
            !selectedProjectIdForReport
              ? "Selecione uma obra para gerar este relatório."
              : undefined
          }
        />

        <ReportCard
          title="Livro de Obra Digital"
          description="Consolidação dos Registos Diários de Obra (RDOs)."
          icon={BookText}
          buttonText="Aceder Livro de Obra"
          to="/compliance/livro-de-obra"
        />
      </div>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* ======================
          Relatórios de Base
      ====================== */}
      <h2 className="text-xl font-semibold mb-4 text-primary">
        Relatórios de Base de Dados
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <ReportCard
          title="Catálogo de Artigos"
          description="Lista completa de artigos de trabalho."
          icon={Archive}
          buttonText="Gerar Relatório"
          onClick={() =>
            handleGenerateReportClick(
              ReportType.ARTICLES_CATALOG,
              { month: selectedMonth },
              null
            )
          }
          isLoading={isLoadingReport}
        />

        <ReportCard
          title="Histórico de Preços"
          description="Evolução dos preços ao longo do tempo."
          icon={History}
          buttonText="Gerar Relatório"
          disabled
          infoText="Este relatório ainda não está disponível."
        />
      </div>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* ======================
          Outros Relatórios
      ====================== */}
      <h2 className="text-xl font-semibold mb-4 text-primary">
        Outros Relatórios
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <ReportCard
          title="Alertas de IA"
          description="Relatório de alertas gerados pelo assistente de IA."
          icon={BellRing}
          buttonText="Ver Alertas"
          to="/automation-intelligence/ai-alerts"
        />

        <ReportCard
          title="Checklist de Conformidade"
          description="Estado das verificações legais e operacionais."
          icon={CheckSquare}
          buttonText="Consultar Checklist"
          to="/compliance/checklist"
        />
      </div>
    </div>
  );
};

export default ReportsPage;
