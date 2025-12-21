"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Budgeting = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar à Página Inicial
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-center flex-grow">
          Módulo 1: Orçamentação e Controlo de Custos
        </h1>
        <div className="w-48"></div> {/* Placeholder for alignment */}
      </div>

      <p className="text-lg text-gray-700 dark:text-gray-300 text-center">
        Este módulo é o coração do "Obra Sys", projetado para transformar a orçamentação de construção em uma operação precisa e preditiva impulsionada por IA.
      </p>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Levantamentos de Quantidades Automatizados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              A plataforma utilizará IA para analisar plantas de projeto e modelos BIM, calculando automaticamente as quantidades de materiais necessárias.
            </p>
            <Button className="mt-4 w-full" disabled>
              Integrar BIM (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preços de Materiais e Mão de Obra em Tempo Real</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Integração com fontes de dados públicas (INE, Gerador de Preços), web scraping ético de retalhistas e APIs de fornecedores para preços atualizados.
            </p>
            <Button className="mt-4 w-full" disabled>
              Ver Preços (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Criação Dinâmica de Orçamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Crie orçamentos detalhados, segmentados por fases do projeto, categorias de custos (mão de obra, materiais, equipamentos, etc.) e unidades de medida.
            </p>
            <Button className="mt-4 w-full" disabled>
              Gerar Orçamento (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise de Variações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monitorize os custos reais em comparação com os valores orçamentados em tempo real, identificando desvios e permitindo ações corretivas imediatas.
            </p>
            <Button className="mt-4 w-full" disabled>
              Ver Variações (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Previsão Preditiva de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Modelos de Machine Learning preveem futuros preços de materiais, custos de mão de obra e custos totais do projeto, considerando tendências de mercado.
            </p>
            <Button className="mt-4 w-full" disabled>
              Ver Previsões (Em breve)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Budgeting;