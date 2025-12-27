"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BellRing, Lightbulb, Bot, Activity, Monitor } from "lucide-react";
import NavButton from "@/components/NavButton"; // Importar NavButton
import { useSession } from "@/components/SessionContextProvider"; // Import useSession
import { Profile } from "@/schemas/profile-schema"; // Import Profile schema
import { toast } from "sonner"; // Import toast

const AutomationIntelligence = () => {
  const navigate = useNavigate();
  const { profile } = useSession(); // Get profile from session

  const userPlanType = profile?.plan_type || 'trialing';
  const isInitiantePlan = userPlanType === 'iniciante' || userPlanType === 'trialing';
  const isProfessionalPlan = userPlanType === 'profissional' || userPlanType === 'empresa';

  if (isInitiantePlan) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
            Automação & Inteligência
          </h1>
        </div>
        <section className="text-center max-w-3xl mx-auto mb-8">
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Aqui centraliza ferramentas de IA e automação para otimizar a tomada de decisões
            e a eficiência operacional.
          </p>
        </section>
        <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />
        <Card className="bg-card text-card-foreground border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Funcionalidade não disponível no seu plano</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              As funcionalidades de Automação & Inteligência estão disponíveis apenas para planos Profissional e Empresa. Faça upgrade para aceder a esta funcionalidade.
            </p>
            <Button className="mt-6 w-full" onClick={() => navigate("/plans")}>
              Ver Planos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 md:pb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center md:text-left text-primary dark:text-primary-foreground flex-grow">
          Automação & Inteligência
        </h1>
      </div>

      {/* Introduction Section */}
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          Aqui centraliza ferramentas de IA e automação para otimizar a tomada de decisões
          e a eficiência operacional.
        </p>
      </section>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Alertas Inteligentes */}
        <Card className="hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <BellRing className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Alertas Inteligentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Receba notificações proativas sobre atrasos no projeto, estouros de orçamento
              e outros eventos críticos.
            </p>
            <NavButton
              className="mt-6 w-full"
              to="/automation-intelligence/ai-alerts" /* Rota atualizada */
            >
              Ver Alertas
            </NavButton>
          </CardContent>
        </Card>

        {/* Sugestões de Replaneamento */}
        <Card className="hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Lightbulb className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Sugestões de Replaneamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Obtenha recomendações baseadas em IA para ajustar cronogramas e recursos
              em resposta a imprevistos.
            </p>
            <NavButton
              className="mt-6 w-full"
              to="/automation-intelligence/replanning-suggestions"
            >
              Ver Sugestões
            </NavButton>
          </CardContent>
        </Card>

        {/* Assistente de IA */}
        <Card className="hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Bot className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <CardTitle className="text-xl font-semibold">Assistente de IA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Um assistente inteligente que prevê datas de conclusão de tarefas
              e projetos com base em dados históricos.
            </p>
            <NavButton
              className="mt-6 w-full"
              to="/automation-intelligence/ai-assistant"
            >
              Interagir com IA
            </NavButton>
          </CardContent>
        </Card>

        {/* Análise de Performance */}
        <Card className="hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Activity className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            <CardTitle className="text-xl font-semibold">Análise de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Avalie o desempenho de cada empreitada com métricas detalhadas
              e insights acionáveis.
            </p>
            <NavButton
              className="mt-6 w-full"
              to="/automation-intelligence/performance-analysis"
            >
              Ver Performance
            </NavButton>
          </CardContent>
        </Card>

        {/* Business Intelligence */}
        <Card className="hover:shadow-xl transition-shadow duration-300 bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Monitor className="h-8 w-8 text-red-500 dark:text-red-400" />
            <CardTitle className="text-xl font-semibold">
              Módulo de Business Intelligence (BI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Painéis interativos e relatórios personalizados para uma visão
              estratégica completa da empresa.
            </p>
            <Button className="mt-6 w-full" disabled>
              Aceder BI (Em breve)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AutomationIntelligence;