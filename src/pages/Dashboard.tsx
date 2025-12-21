"use client";

import React from "react";
import KPICard from "@/components/KPICard";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  HardHat,
  AlertTriangle,
  FileText,
  CalendarDays,
  CheckSquare,
  Plus,
  Users,
  Calculator,
  Upload,
  Bell,
  RefreshCw,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  // isSidebarCollapsed and toggleSidebar are now handled by MainLayout

  return (
    <div className="space-y-6"> {/* Main content wrapper for Dashboard */}
      {/* Header - now specific to Dashboard content */}
      <div className="flex items-center justify-between pb-6 border-b border-border mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Bem-vindo, Bezerra Cavalcanti
          </h1>
          <p className="text-muted-foreground text-sm">Administrador</p>
        </div>
        {/* Bell, Settings, Avatar are now in MainLayout's header, removed from here to avoid duplication */}
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <KPICard
          title="Obras Ativas"
          value="0"
          description="+2 esta semana"
          icon={HardHat}
          iconColorClass="text-blue-500"
        />
        <KPICard
          title="Obras em Atraso"
          value="0"
          description="-1 desde ontem"
          icon={AlertTriangle}
          iconColorClass="text-orange-500"
        />
        <KPICard
          title="Relatórios Pendentes"
          value="0"
          description="+5 hoje"
          icon={FileText}
          iconColorClass="text-purple-500"
        />
        <KPICard
          title="Tarefas Agendadas"
          value="0"
          description="esta semana"
          icon={CalendarDays}
          iconColorClass="text-green-500"
        />
        <KPICard
          title="Aprovações Pendentes"
          value="0"
          description="requer ação"
          icon={CheckSquare}
          iconColorClass="text-red-500"
        />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Obras Ativas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                Obras Ativas
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/projects">Ver Todas</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={HardHat}
                title="Nenhuma obra ativa encontrada"
                description="Comece um novo projeto para ver o seu progresso aqui."
                buttonText="Nova Obra"
                onButtonClick={() => console.log("Nova Obra")}
              />
            </CardContent>
          </Card>

          {/* Relatórios Recentes (Placeholder) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                Relatórios Recentes
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/reports">Ver Todos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={FileText}
                title="Nenhum relatório recente"
                description="Os relatórios gerados recentemente aparecerão aqui."
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button className="h-20 flex flex-col items-center justify-center text-center bg-blue-600 hover:bg-blue-700 text-white">
                  <HardHat className="h-5 w-5 mb-1" />
                  <span className="text-sm">Nova Obra</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                  <Users className="h-5 w-5 mb-1" />
                  <span className="text-sm">Gerir Utilizadores</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                  <Calculator className="h-5 w-5 mb-1" />
                  <span className="text-sm">Gerar Orçamento</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                  <FileText className="h-5 w-5 mb-1" />
                  <span className="text-sm">Relatórios</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                  <Upload className="h-5 w-5 mb-1" />
                  <span className="text-sm">Importar Dados</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center text-center">
                  <Settings className="h-5 w-5 mb-1" />
                  <span className="text-sm">Gestão da Empresa</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" /> Notificações
              </CardTitle>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Bell}
                title="Não há notificações"
                description="As suas notificações aparecerão aqui."
              />
            </CardContent>
          </Card>

          {/* Agenda & Tarefas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" /> Agenda & Tarefas
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={CalendarDays}
                title="Nenhuma tarefa agendada"
                description="Adicione tarefas para acompanhar o progresso."
                buttonText="Adicionar tarefa"
                onButtonClick={() => console.log("Adicionar tarefa")}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;