"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ReceiptText, Handshake, Warehouse, Truck, ShieldCheck, Lightbulb, AlertTriangle, Scale } from "lucide-react"; // Import icons
import { Link } from "react-router-dom";

const SupplyChain = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto p-6 space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 pb-6">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar à Página Inicial
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold text-center text-primary dark:text-primary-foreground flex-grow">
            Módulo 3: Otimização Inteligente de Compras e Cadeia de Abastecimento
          </h1>
          <div className="w-48 md:block hidden"></div> {/* Placeholder for alignment on larger screens */}
        </div>

        {/* Introduction Section */}
        <section className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed">
            Este módulo visa otimizar a aquisição de materiais e a gestão da cadeia de abastecimento, transformando processos reativos em vantagens estratégicas.
          </p>
        </section>

        <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <ReceiptText className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              <CardTitle className="text-xl font-semibold">Requisição Automatizada de Materiais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Digitalizar e automatizar o processo de requisição e autorização de materiais, garantindo registos precisos e gestão de inventário.
              </p>
              <Button className="mt-6 w-full" disabled>
                Gerir Requisições (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <Handshake className="h-8 w-8 text-green-500 dark:text-green-400" />
              <CardTitle className="text-xl font-semibold">Correspondência Inteligente de Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Utilizar IA para corresponder empreiteiros aos fornecedores mais adequados com base em critérios como preço, disponibilidade, localização e desempenho histórico.
              </p>
              <Button className="mt-6 w-full" disabled>
                Encontrar Fornecedores (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <Warehouse className="h-8 w-8 text-purple-500 dark:text-purple-400" />
              <CardTitle className="text-xl font-semibold">Rastreamento de Inventário em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Monitorizar os níveis de stock em vários locais de projeto e armazéns, acionando reordens automáticas quando os suprimentos estão baixos.
              </p>
              <Button className="mt-6 w-full" disabled>
                Ver Inventário (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <Truck className="h-8 w-8 text-orange-500 dark:text-orange-400" />
              <CardTitle className="text-xl font-semibold">Otimização Logística</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Funcionalidades para rastrear remessas, otimizar rotas e cronogramas de entrega, e gerir o carregamento de carga para máxima eficiência.
              </p>
              <Button className="mt-6 w-full" disabled>
                Otimizar Entregas (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <ShieldCheck className="h-8 w-8 text-red-500 dark:text-red-400" />
              <CardTitle className="text-xl font-semibold">Gestão de Conformidade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Automatizar a verificação de fornecedores para conformidade, certificações e padrões de sustentabilidade.
              </p>
              <Button className="mt-6 w-full" disabled>
                Ver Conformidade (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <Lightbulb className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
              <CardTitle className="text-xl font-semibold">Previsão Preditiva da Demanda</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Algoritmos de IA analisarão tendências de mercado, dados de compras anteriores e cronogramas de projetos para prever a demanda de materiais.
              </p>
              <Button className="mt-6 w-full" disabled>
                Ver Previsões (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <AlertTriangle className="h-8 w-8 text-cyan-500 dark:text-cyan-400" />
              <CardTitle className="text-xl font-semibold">Verificação de Fornecedores e Mitigação de Riscos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                A IA pode otimizar a verificação de credenciais de fornecedores e identificar potenciais riscos na cadeia de abastecimento.
              </p>
              <Button className="mt-6 w-full" disabled>
                Analisar Riscos (Em breve)
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center space-x-4 pb-2">
              <Scale className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
              <CardTitle className="text-xl font-semibold">Comparação de Preços e Suporte à Negociação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                A IA pode analisar preços de mercado em tempo real de várias fontes para fornecer recomendações de compra ótimas e informações para negociação.
              </p>
              <Button className="mt-6 w-full" disabled>
                Comparar Preços (Em breve)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupplyChain;