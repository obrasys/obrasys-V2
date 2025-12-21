"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CalendarDays, Users, ClipboardList, BookText, MessageSquareMore, FolderOpen, Box, Zap } from "lucide-react"; // Import icons
// Removed Link and ArrowLeft as navigation is handled by Sidebar

const ProjectManagement = () => {
  return (
    <div className="space-y-6"> {/* Main content wrapper */}
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6">
        {/* Removed "Voltar à Página Inicial" button */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-primary dark:text-primary-foreground flex-grow">
          Módulo 2: Gestão de Projetos e Planeamento Integrados
        </h1>
        {/* Removed placeholder div */}
      </div>

      {/* Introduction Section */}
      <section className="text-center max-w-3xl mx-auto mb-8">
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          Este módulo visa centralizar e otimizar todas as atividades de gestão de projetos, desde o planeamento inicial até a execução.
        </p>
      </section>

      <Separator className="my-8 bg-gray-300 dark:bg-gray-700" />

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <CalendarDays className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            <CardTitle className="text-xl font-semibold">Planeamento Colaborativo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Gráficos de Gantt intuitivos para visualizar cronogramas de projetos, dependências e caminhos críticos.
            </p>
            <Button className="mt-6 w-full" disabled>
              Ver Cronogramas (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Users className="h-8 w-8 text-green-500 dark:text-green-400" />
            <CardTitle className="text-xl font-semibold">Alocação de Recursos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Gestão e acompanhamento eficientes de recursos humanos e equipamentos em múltiplos projetos.
            </p>
            <Button className="mt-6 w-full" disabled>
              Gerir Recursos (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <ClipboardList className="h-8 w-8 text-purple-500 dark:text-purple-400" />
            <CardTitle className="text-xl font-semibold">Gestão de Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Criação, atribuição, acompanhamento e priorização de tarefas com estados personalizados.
            </p>
            <Button className="mt-6 w-full" disabled>
              Gerir Tarefas (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <BookText className="h-8 w-8 text-orange-500 dark:text-orange-400" />
            <CardTitle className="text-xl font-semibold">Diários de Obra e Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Registo diário das atividades no local, atualizações de progresso e geração de relatórios automatizados.
            </p>
            <Button className="mt-6 w-full" disabled>
              Ver Relatórios (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <MessageSquareMore className="h-8 w-8 text-red-500 dark:text-red-400" />
            <CardTitle className="text-xl font-semibold">Gestão de Pedidos de Informação (RFI/RFP)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Otimização da criação, submissão, acompanhamento e resposta a RFIs e RFPs.
            </p>
            <Button className="mt-6 w-full" disabled>
              Gerir RFIs (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <FolderOpen className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
            <CardTitle className="text-xl font-semibold">Controlo de Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Repositório centralizado para plantas, especificações, contratos, com controlo de versões.
            </p>
            <Button className="mt-6 w-full" disabled>
              Gerir Documentos (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Box className="h-8 w-8 text-cyan-500 dark:text-cyan-400" />
            <CardTitle className="text-xl font-semibold">Integração BIM</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Acesso centralizado a modelos BIM 3D, deteção de conflitos e simulação 4D/5D.
            </p>
            <Button className="mt-6 w-full" disabled>
              Ver Modelos BIM (Em breve)
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-shadow duration-300 ease-in-out bg-card text-card-foreground border border-border">
          <CardHeader className="flex flex-row items-center space-x-4 pb-2">
            <Zap className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
            <CardTitle className="text-xl font-semibold">Automação de Fluxos de Trabalho</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-2">
              Automatizar tarefas rotineiras e notificações, melhorando a eficiência e reduzindo erros manuais.
            </p>
            <Button className="mt-6 w-full" disabled>
              Configurar Automações (Em breve)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectManagement;