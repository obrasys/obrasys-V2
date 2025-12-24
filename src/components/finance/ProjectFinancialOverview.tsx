"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KPICard from "@/components/KPICard";
import { DollarSign, TrendingUp, Calculator, Percent } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Project } from "@/schemas/project-schema";
import { BudgetDB } from "@/schemas/budget-schema";

interface ProjectFinancialOverviewProps {
  project: Project;
  budget: BudgetDB | null;
}

const ProjectFinancialOverview: React.FC<ProjectFinancialOverviewProps> = ({ project, budget }) => {
  const plannedCost = budget?.total_planeado || project.custo_planeado || 0;
  const actualCost = budget?.total_executado || project.custo_real || 0; // Prioriza o orçamento se disponível
  const deviation = actualCost - plannedCost;
  const deviationPercentage = plannedCost > 0 ? (deviation / plannedCost) * 100 : 0;
  const margin = plannedCost > 0 ? ((plannedCost - actualCost) / plannedCost) * 100 : 0;

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Visão Geral Financeira da Obra</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Custo Planeado"
            value={formatCurrency(plannedCost)}
            description="Orçamento total da obra"
            icon={Calculator}
            iconColorClass="text-blue-500"
          />
          <KPICard
            title="Custo Real"
            value={formatCurrency(actualCost)}
            description="Custo atual da obra"
            icon={DollarSign}
            iconColorClass="text-green-500"
          />
          <KPICard
            title="Desvio (€ / %)"
            value={`${formatCurrency(deviation)} (${deviationPercentage.toFixed(1)}%)`}
            description="Diferença entre real e planeado"
            icon={TrendingUp}
            iconColorClass={deviation >= 0 ? "text-red-500" : "text-green-500"}
          />
          <KPICard
            title="Margem (%)"
            value={`${margin.toFixed(1)}%`}
            description="Margem de lucro atual"
            icon={Percent}
            iconColorClass={margin >= 0 ? "text-green-500" : "text-red-500"}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFinancialOverview;