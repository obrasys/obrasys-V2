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
  Printer,
} from "lucide-react";
import NavButton from "@/components/NavButton";
import { Skeleton } from "@/components/ui/skeleton";

// Importar os novos componentes modulares
import ReportHeader from "@/components/reports/ReportHeader";
import ReportDescription from "@/components/reports/ReportDescription";
import ReportParameters from "@/components/reports/ReportParameters";
import ReportCard from "@/components/reports/ReportCard";

// Importar o novo hook
import { useReportGeneration } from "@/hooks/use-report-generation";
import { format } from "date-fns";

const ReportsPage = () => {
  const {
    userCompanyId,
    projects,
    isLoadingInitialData,
    isLoadingReport,
    handleGenerateReportClick,
  } = useReportGeneration();

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedProjectIdForReport, setSelectedProjectIdForReport] = useState<string | null>(null);

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
        isLoadingProjects={isLoadingInitialData} // Use isLoadingInitialData for projects loading
      />

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Relatórios Financeiros */}
      <h2 className="text-xl font-semibold mb-4 text-primary">Relatórios Financeiros</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <ReportCard
          title="Relatório Financeiro Mensal"
          description="Acompanhe a saúde financeira mês a mês e apoie decisões rápidas."
          icon={Scale}
          buttonText="Gerar Relatório"
          onClick={() => handleGenerateReportClick("Relatório Financeiro Mensal", selectedMonth, null)}
          isLoading={isLoadingReport}
        />

        <ReportCard
          title="Relatório de Fluxo de Caixa"
          description="Garantir liquidez e evitar surpresas."
          icon={TrendingUp}
          buttonText="Gerar Relatório"
          onClick={() => handleGenerateReportClick("Relatório de Fluxo de Caixa", selectedMonth, null)}
          isLoading={isLoadingReport}
        />

        <ReportCard
          title="Relatório de Faturas"
          description="Visão geral das faturas emitidas, pagas e pendentes."
          icon={ReceiptText}
          buttonText="Gerar Relatório"
          onClick={() => handleGenerateReportClick("Faturas", selectedMonth, null)}
          isLoading={isLoadingReport}
        />

        <ReportCard
          title="Relatório de Despesas"
          description="Análise detalhada das despesas por fornecedor, categoria e estado."
          icon={Wallet}
          buttonText="Gerar Relatório"
          onClick={() => handleGenerateReportClick("Despesas", selectedMonth, null)}
          isLoading={isLoadingReport}
        />

        <ReportCard
          title="Relatório de Folha de Pagamento"
          description="Custos de mão de obra, salários e benefícios por projeto e colaborador."
          icon={ClipboardList}
          buttonText="Gerar Relatório"
          onClick={() => handleGenerateReportClick("Folha de Pagamento", selectedMonth, null)}
          isLoading={isLoadingReport}
        />
      </div>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Relatórios de Obra */}
      <h2 className="text-xl font-semibold mb-4 text-primary">Relatórios de Obra</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <ReportCard
          title="Relatório Financeiro por Projeto / Obra"
          description="Controlar rentabilidade de cada obra/projeto."
          icon={HardHat}
          buttonText="Gerar Relatório"
          onClick={() => handleGenerateReportClick("Relatório Financeiro por Projeto / Obra", selectedMonth, selectedProjectIdForReport)}
          disabled={!selectedProjectIdForReport}
          isLoading={isLoadingReport}
          infoText={!selectedProjectIdForReport ? "Selecione uma obra para gerar este relatório." : undefined}
        />

        <ReportCard
          title="Relatório de Progresso da Obra"
          description="Acompanhamento do progresso físico e financeiro de cada projeto."
          icon={HardHat}
          buttonText="Gerar Relatório"
          onClick={() => handleGenerateReportClick("Progresso da Obra", selectedMonth, selectedProjectIdForReport)}
          disabled={!selectedProjectIdForReport}
          isLoading={isLoadingReport}
          infoText={!selectedProjectIdForReport ? "Selecione uma obra para gerar este relatório." : undefined}
        />

        <ReportCard
          title="Relatório de Orçamento da Obra"
          description="Comparativo entre o orçamento planeado e o custo real da obra."
          icon={DollarSign}
          buttonText="Gerar Relatório"
          onClick={() => handleGenerateReportClick("Orçamento da Obra", selectedMonth, selectedProjectIdForReport)}
          disabled={!selectedProjectIdForReport}
          isLoading={isLoadingReport}
          infoText={!selectedProjectIdForReport ? "Selecione uma obra para gerar este relatório." : undefined}
        />

        <ReportCard
          title="Livro de Obra Digital"
          description="Consolidação dos Registos Diários de Obra (RDOs) em formato digital."
          icon={BookText}
          buttonText="Aceder Livro de Obra"
          to="/compliance/livro-de-obra"
        />
      </div>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Relatórios de Base de Dados */}
      <h2 className="text-xl font-semibold mb-4 text-primary">Relatórios de Base de Dados</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <ReportCard
          title="Catálogo de Artigos"
          description="Lista completa de todos os artigos de trabalho (serviços, materiais, equipas)."
          icon={Archive}
          buttonText="Gerar Relatório"
          onClick={() => handleGenerateReportClick("Catálogo de Artigos", selectedMonth, null)}
          isLoading={isLoadingReport}
        />

        <ReportCard
          title="Histórico de Preços"
          description="Evolução dos preços dos artigos ao longo do tempo."
          icon={History}
          buttonText="Gerar Relatório"
          onClick={() => handleGenerateReportClick("Histórico de Preços", selectedMonth, null)}
          isLoading={isLoadingReport}
          infoText="Este relatório requer dados de histórico de preços que ainda não estão implementados."
          disabled={true} // Temporarily disable as data is not implemented
        />
      </div>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Outros Relatórios */}
      <h2 className="text-xl font-semibold mb-4 text-primary">Outros Relatórios</h2>
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
          description="Estado das verificações de conformidade legal e operacional."
          icon={CheckSquare}
          buttonText="Consultar Checklist"
          to="/compliance/checklist"
        />
      </div>
    </div>
  );
};

export default ReportsPage;