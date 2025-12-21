"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, FileText, TrendingUp, LineChart } from "lucide-react"; // Import icons
// Removed Link and ArrowLeft as navigation is handled by Sidebar

const Budgeting = () => {
  return (
    <div className="space-y-6"> {/* Main content wrapper */}
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6">
        {/* Removed "Voltar à Página Inicial" button */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-primary dark:text-primary-foreground flex-grow">
          Módulo 1: Orçamentação e Controlo de Custos
        </h1>
        {/* Removed placeholder div */}
      </div>

      {/* Introduction Section */}
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Este módulo é o coração do "Obra Sys", projetado para transformar a orçamentação de construção de um processo manual e propenso a erros em uma operação precisa e preditiva impulsionada por IA.
        </p>
      </section>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Calculator className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Levantamentos de Quantidades Automatizados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              A plataforma utilizará IA para analisar plantas de projeto e modelos BIM, calculando automaticamente as quantidades de materiais necessárias.
            </p>
            <Button className="mt-6 w-full" disabled>
              Integrar BIM (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <DollarSign className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Preços de Materiais e Mão de Obra em Tempo Real</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Integração com fontes de dados públicas (INE, Gerador de Preços), web scraping ético de retalhistas e APIs de fornecedores para preços atualizados.
            </p>
            <Button className="mt-6 w-full" disabled>
              Ver Preços (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <FileText className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <CardTitle className="text-xl font-semibold">Criação Dinâmica de Orçamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Crie orçamentos detalhados, segmentados por fases do projeto, categorias de custos (mão de obra, materiais, equipamentos, etc.) e unidades de medida.
            </p>
            <Button className="mt-6 w-full" disabled>
              Gerar Orçamento (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <TrendingUp className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            <CardTitle className="text-xl font-semibold">Análise de Variações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Monitorize os custos reais em comparação com os valores orçamentados em tempo real, identificando desvios e permitindo ações corretivas imediatas.
            </p>
            <Button className="mt-6 w-full" disabled>
              Ver Variações (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <LineChart className="h-8 w-8 text-red-500 dark:text-red-400" />
            <CardTitle className="text-xl font-semibold">Previsão Preditiva de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Modelos de Machine Learning preveem futuros preços de materiais, custos de mão de obra e custos totais do projeto, considerando tendências de mercado.
            </p>
            <Button className="mt-6 w-full" disabled>
              Ver Previsões (Em breve)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Budgeting;