"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  FileText,
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
import NavButton from "@/components/NavButton";
import { toast } from "sonner";

const ReportsPage = () => {
  const handleGenerateReport = (reportName: string) => {
    toast.info(`Gerar relatório: ${reportName} (Em breve)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Geração de Relatórios
        </h1>
      </div>

      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Aceda a relatórios detalhados e personalizáveis para todas as áreas da sua gestão de obras.
        </p>
      </section>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Relatórios Financeiros */}
      <h2 className="text-xl font-semibold mb-4 text-primary">Relatórios Financeiros</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <ReceiptText className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Relatório de Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Visão geral das faturas emitidas, pagas e pendentes.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReport("Faturas")}>
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Wallet className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Relatório de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Análise detalhada das despesas por fornecedor, categoria e estado.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReport("Despesas")}>
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <ClipboardList className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <CardTitle className="text-xl font-semibold">Relatório de Folha de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Custos de mão de obra, salários e benefícios por projeto e colaborador.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReport("Folha de Pagamento")}>
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <TrendingUp className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            <CardTitle className="text-xl font-semibold">Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Projeções e histórico do fluxo de caixa da empresa.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReport("Fluxo de Caixa")}>
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Relatórios de Obra */}
      <h2 className="text-xl font-semibold mb-4 text-primary">Relatórios de Obra</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <HardHat className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Relatório de Progresso da Obra</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Acompanhamento do progresso físico e financeiro de cada projeto.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReport("Progresso da Obra")}>
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <DollarSign className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Relatório de Orçamento da Obra</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Comparativo entre o orçamento planeado e o custo real da obra.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReport("Orçamento da Obra")}>
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <BookText className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <CardTitle className="text-xl font-semibold">Livro de Obra Digital</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Consolidação dos Registos Diários de Obra (RDOs) em formato digital.
            </p>
            <NavButton className="mt-6 w-full" to="/compliance/livro-de-obra">
              Aceder Livro de Obra
            </NavButton>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Relatórios de Base de Dados */}
      <h2 className="text-xl font-semibold mb-4 text-primary">Relatórios de Base de Dados</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Archive className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Catálogo de Artigos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Lista completa de todos os artigos de trabalho (serviços, materiais, equipas).
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReport("Catálogo de Artigos")}>
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <History className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Histórico de Preços</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Evolução dos preços dos artigos ao longo do tempo.
            </p>
            <Button className="mt-6 w-full" onClick={() => handleGenerateReport("Histórico de Preços")}>
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Outros Relatórios */}
      <h2 className="text-xl font-semibold mb-4 text-primary">Outros Relatórios</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <BellRing className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Alertas de IA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Relatório de alertas gerados pelo assistente de IA.
            </p>
            <NavButton className="mt-6 w-full" to="/automation-intelligence/ai-alerts">
              Ver Alertas
            </NavButton>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <CheckSquare className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Checklist de Conformidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Estado das verificações de conformidade legal e operacional.
            </p>
            <NavButton className="mt-6 w-full" to="/compliance/checklist">
              Consultar Checklist
            </NavButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;