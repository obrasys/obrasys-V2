"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KPICard from "@/components/KPICard";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Percent,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Project } from "@/schemas/project-schema";
import { BudgetDB } from "@/schemas/budget-schema";

interface ProjectFinancialOverviewProps {
  project: Project;
  budget: BudgetDB | null;

  /** FUTURO (Finance / Invoicing) */
  totalInvoiced?: number;
  totalReceived?: number;
  totalExpenses?: number;
}

const safe = (v?: number) =>
  Number.isFinite(v as number) ? (v as number) : 0;

const ProjectFinancialOverview: React.FC<
  ProjectFinancialOverviewProps
> = ({
  project,
  budget,
  totalInvoiced = 0,
  totalReceived = 0,
  totalExpenses = 0,
}) => {
  /** Custos */
  const plannedCost =
    safe(budget?.total_planeado) ||
    safe(project.custo_planeado);

  const executedCost =
    safe(budget?.total_executado) ||
    safe(project.custo_real);

  /** Financeiro */
  const realCost = executedCost + totalExpenses;
  const deviation = realCost - plannedCost;

  const deviationPct =
    plannedCost > 0
      ? (deviation / plannedCost) * 100
      : 0;

  const marginPct =
    plannedCost > 0
      ? ((plannedCost - realCost) /
          plannedCost) *
        100
      : 0;

  const projectBalance =
    totalReceived - realCost;

  return (
    <Card className="bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Visão Financeira da Obra
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Custo Planeado"
            value={formatCurrency(plannedCost)}
            description="Orçamento aprovado"
            icon={Calculator}
            iconColorClass="text-blue-500"
          />

          <KPICard
            title="Custo Real"
            value={formatCurrency(realCost)}
            description="Executado + despesas"
            icon={DollarSign}
            iconColorClass="text-orange-500"
          />

          <KPICard
            title="Desvio"
            value={`${formatCurrency(
              deviation
            )} (${deviationPct.toFixed(
              1
            )}%)`}
            description="Variação face ao planeado"
            icon={TrendingUp}
            iconColorClass={
              deviation > 0
                ? "text-red-500"
                : "text-green-500"
            }
          />

          <KPICard
            title="Margem Atual"
            value={`${marginPct.toFixed(1)}%`}
            description="Margem da obra"
            icon={Percent}
            iconColorClass={
              marginPct >= 0
                ? "text-green-500"
                : "text-red-500"
            }
          />

          <KPICard
            title="Saldo do Projeto"
            value={formatCurrency(projectBalance)}
            description="Recebido − gasto"
            icon={Wallet}
            iconColorClass={
              projectBalance >= 0
                ? "text-green-500"
                : "text-red-500"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFinancialOverview;
