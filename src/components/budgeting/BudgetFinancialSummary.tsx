"use client";

import React from "react";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  LineChart,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KPICard from "@/components/KPICard";
import { formatCurrency } from "@/utils/formatters";
import {
  getDeviationRisk,
  getMarginRisk,
  riskColorMap,
} from "@/utils/budget-risk";
import { Badge } from "@/components/ui/badge";

interface BudgetFinancialSummaryProps {
  currentBudgetTotal: number;
  totalExecuted: number;
}

/* =========================
   HELPERS
========================= */

const safeNumber = (value: number): number =>
  Number.isFinite(value) ? value : 0;

const formatPercent = (value: number): string =>
  `${safeNumber(value).toFixed(1)}%`;

const BudgetFinancialSummary: React.FC<
  BudgetFinancialSummaryProps
> = ({ currentBudgetTotal, totalExecuted }) => {
  const totalBudget = safeNumber(currentBudgetTotal);
  const executedCost = safeNumber(totalExecuted);

  const budgetDeviation = executedCost - totalBudget;
  const budgetDeviationPercentage =
    totalBudget > 0
      ? (budgetDeviation / totalBudget) * 100
      : 0;

  const predictedFinalCost = totalBudget + budgetDeviation;

  const currentMargin =
    totalBudget > 0
      ? ((totalBudget - executedCost) /
          totalBudget) *
        100
      : 0;

  const deviationRisk =
    getDeviationRisk(budgetDeviationPercentage);
  const marginRisk = getMarginRisk(currentMargin);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl tracking-tight">
          Resumo Financeiro
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KPICard
            title="Orçamento Total"
            value={formatCurrency(totalBudget)}
            description="Valor planeado para a obra"
            icon={Calculator}
            iconColorClass="text-blue-500"
          />

          <KPICard
            title="Custo Executado"
            value={formatCurrency(executedCost)}
            description="Valor já gasto"
            icon={DollarSign}
            iconColorClass="text-green-500"
          />

          <KPICard
            title="Desvio Orçamental"
            value={`${formatCurrency(
              budgetDeviation
            )} (${formatPercent(
              budgetDeviationPercentage
            )})`}
            description="Diferença entre planeado e executado"
            icon={TrendingUp}
            iconColorClass={
              budgetDeviation > 0
                ? "text-red-500"
                : "text-green-500"
            }
            extra={
              <Badge
                className={
                  riskColorMap[deviationRisk]
                }
              >
                {deviationRisk === "low"
                  ? "Risco Baixo"
                  : deviationRisk === "medium"
                  ? "Risco Médio"
                  : "Risco Alto"}
              </Badge>
            }
          />

          <KPICard
            title="Custo Previsto Final"
            value={formatCurrency(
              predictedFinalCost
            )}
            description="Estimativa de custo total"
            icon={LineChart}
            iconColorClass="text-purple-500"
          />

          <KPICard
            title="Margem Atual"
            value={formatPercent(currentMargin)}
            description="Margem de lucro atual"
            icon={DollarSign}
            iconColorClass={
              currentMargin >= 0
                ? "text-green-500"
                : "text-red-500"
            }
            extra={
              <Badge
                className={
                  riskColorMap[marginRisk]
                }
              >
                {marginRisk === "low"
                  ? "Risco Baixo"
                  : marginRisk === "medium"
                  ? "Risco Médio"
                  : "Risco Alto"}
              </Badge>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetFinancialSummary;
