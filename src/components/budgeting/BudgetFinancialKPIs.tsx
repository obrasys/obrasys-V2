"use client";

import React from "react";
import KPICard from "@/components/KPICard";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  LineChart,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface BudgetFinancialKPIsProps {
  totalBudget: number;
  executedCost: number;
  budgetDeviation: number;
  budgetDeviationPercentage: number;
  predictedFinalCost: number;
  currentMargin: number;
}

/* =========================
   HELPERS
========================= */

const safeNumber = (value: number): number =>
  Number.isFinite(value) ? value : 0;

const formatPercent = (value: number): string =>
  `${safeNumber(value).toFixed(1)}%`;

const BudgetFinancialKPIs: React.FC<
  BudgetFinancialKPIsProps
> = ({
  totalBudget,
  executedCost,
  budgetDeviation,
  budgetDeviationPercentage,
  predictedFinalCost,
  currentMargin,
}) => {
  const safeDeviation = safeNumber(budgetDeviation);
  const safeMargin = safeNumber(currentMargin);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
      <KPICard
        title="Orçamento Total"
        value={formatCurrency(safeNumber(totalBudget))}
        description="Valor planeado para a obra"
        icon={Calculator}
        iconColorClass="text-blue-500"
      />

      <KPICard
        title="Custo Executado"
        value={formatCurrency(safeNumber(executedCost))}
        description="Valor já gasto"
        icon={DollarSign}
        iconColorClass="text-green-500"
      />

      <KPICard
        title="Desvio Orçamental"
        value={`${formatCurrency(
          safeDeviation
        )} (${formatPercent(
          budgetDeviationPercentage
        )})`}
        description="Diferença entre planeado e executado"
        icon={TrendingUp}
        iconColorClass={
          safeDeviation > 0
            ? "text-red-500"
            : "text-green-500"
        }
      />

      <KPICard
        title="Custo Previsto Final"
        value={formatCurrency(
          safeNumber(predictedFinalCost)
        )}
        description="Estimativa de custo total"
        icon={LineChart}
        iconColorClass="text-purple-500"
      />

      <KPICard
        title="Margem Atual"
        value={formatPercent(safeMargin)}
        description="Margem de lucro atual"
        icon={DollarSign}
        iconColorClass={
          safeMargin >= 0
            ? "text-green-500"
            : "text-red-500"
        }
      />
    </section>
  );
};

export default BudgetFinancialKPIs;
